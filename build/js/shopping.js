'use strict';

class Subscribers {
    #subscribers;

    constructor() {
        this.#subscribers = [];
    }

    add(subscriber) {
        if (typeof subscriber === 'function') {
            this.#subscribers.push(subscriber);
            return true;
        }

        return false;
    }

    notify(...args) {
        for (const subscriber of this.#subscribers) {
            subscriber(...args);
        }
    }
}

export default class ShoppingCartStore {
    #storageEnabled;
    #readonly;
    #items;
    #itemsInCart;
    #cartUpdateSubscribers;
    #textEncoder;

    constructor(items) {
        this.#items = {};
        this.#itemsInCart = [];
        this.#cartUpdateSubscribers = new Subscribers();
        this.#textEncoder = new TextEncoder();

        const updateCart = this.#updateCart.bind(this);
        for (const [id, configItem] of Object.entries(items)) {
            const item = {
                name: configItem.name,
                cost: configItem.cost,
                count: 0,
                subscribers: new Subscribers(),
                inCart: false,
            };

            item.accessor = {
                get count() {
                    return item.count;
                },

                set count(newCount) {
                    item.count = newCount;
                    item.subscribers.notify(newCount);
                    updateCart(id);
                },

                subscribe(subscriber) {
                    if (item.subscribers.add(subscriber)) {
                        subscriber(item.count);
                    }
                },
            };

            this.#items[id] = item;
        }

        let existingCart = null;
        this.#storageEnabled = false;
        const encodedCartFromUrl = new URL(window.location.href).searchParams.get('cart');
        if (encodedCartFromUrl !== null) {
            this.#readonly = true;
            existingCart = new TextDecoder().decode(Uint8Array.fromBase64(encodedCartFromUrl, { alphabet: 'base64url' }));
        } else {
            try {
                if (window.localStorage) {
                    this.#storageEnabled = true;
                    if ('cart' in window.localStorage) {
                        existingCart = window.localStorage['cart'];
                    }
                }
            } catch { }
        }

        if (existingCart !== null) {
            try {
                JSON.parse(existingCart).items.forEach(([id, count]) => {
                    if (!(id in this.#items)) {
                        console.error(`Could not restore item "${id}" from saved cart.`);
                        return;
                    }

                    this.#itemsInCart.push(id);
                    this.#items[id].count = count;
                    this.#items[id].inCart = true;
                });
            } catch (e) {
                console.error('Encountered an error when restoring the cart', e);
            }
        }

        document.addEventListener('add-to-cart', (e) => {
            this.getItemAccessor(e.target.id).count++;
        });
    }

    get #dataToPersist() {
        return {
            items: this.#itemsInCart.map(id => [
                id,
                this.#items[id].count,
            ]),
        };
    }

    #getCartUpdateEvent(id) {
        const event = {
            action: '',
            count: 0,
            cost: 0,
        };

        if (id) {
            event.action = 'update';
            event.id = id;

            const idx = this.#itemsInCart.indexOf(id);
            const item = this.#items[id];
            if (item.count === 0 && idx > -1) {
                this.#itemsInCart.splice(idx, 1);
                event.action = 'remove';
            } else if (item.count > 0 && idx === -1) {
                this.#itemsInCart.push(id);
                event.action = 'add';
            }
        } else {
            event.action = 'init';
            event.ids = this.#itemsInCart;
        }

        if (this.#storageEnabled) {
            event.encodedCart = this.#textEncoder.encode(JSON.stringify(this.#dataToPersist)).toBase64({ alphabet: 'base64url' });
        }

        this.#itemsInCart.map(id => this.#items[id]).forEach(item => {
            event.count += item.count;
            event.cost += item.count * item.cost;
        });

        return event;
    }

    #updateCart(id) {
        this.#cartUpdateSubscribers.notify(this.#getCartUpdateEvent(id));
        if (this.#storageEnabled) {
            window.localStorage['cart'] = JSON.stringify(this.#dataToPersist);
        }
    }

    get storageEnabled() {
        return this.#storageEnabled;
    }

    get readonly() {
        return this.#readonly;
    }

    *enumerateItems() {
        for (const [id, item] of Object.entries(this.#items)) {
            yield Object.freeze({
                id,
                name: item.name,
                cost: item.cost,
            });
        }
    }

    subscribeToCartUpdates(callback) {
        if (this.#cartUpdateSubscribers.add(callback)) {
            callback(this.#getCartUpdateEvent());
        }
    }

    getItemAccessor(id) {
        if (!(id in this.#items)) {
            throw new Error(`Cannot get item accessor for unknown item "${id}"`);
        }

        return this.#items[id].accessor;
    }

    clearCart() {
        this.#itemsInCart = [];
        Object.values(this.#items).forEach(item => {
            item.inCart = false;
            item.count = 0;
        });

        if (this.#storageEnabled) {
            window.localStorage.removeItem('cart');
        }

        this.#cartUpdateSubscribers.notify({
            action: 'clear',
            count: 0,
            cost: 0,
        });
    }
}

class Currency {
    #currency;
    #precisionMultiplier;

    constructor(currency) {
        this.#currency = currency;
        this.#precisionMultiplier = Math.pow(10, currency.precision);
    }

    get baseUnit() {
        return this.#currency['base-unit'];
    }

    #roundToPrecision(value) {
        return Math.round(this.#precisionMultiplier * value) / this.#precisionMultiplier;
    }

    formatCostByUnits(cost) {
        const costByUnits = [];
        this.#currency.units.slice(0, -1).forEach(unit => {
            if (cost >= unit.threshold && cost >= unit.value) {
                const value = Math.floor(this.#roundToPrecision(cost / unit.value));
                cost = this.#roundToPrecision(cost - (value * unit.value));
                costByUnits.push({
                    name: unit.name,
                    value: this.#roundToPrecision(value),
                });
            }
        });
        if (cost > 0) {
            const finalUnit = this.#currency.units[this.#currency.units.length - 1];
            costByUnits.push({
                name: finalUnit.name,
                value: this.#roundToPrecision(cost / finalUnit.value),
            });
        }
        return costByUnits.map(unit => `${unit.value}${unit.name}`).join(' ');
    }
}

class ShoppingItem extends HTMLElement {
    constructor() {
        super();
        if (window.location.search.match(/[?&]cart=/)) {
            return;
        }

        const btn = document.createElement('button');
        btn.classList.add('add-to-cart');
        btn.textContent = 'Add to cart';
        btn.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('add-to-cart', { bubbles: true }));
        });

        this.appendChild(btn);
    }
}

class ShoppingCartItem extends HTMLElement {
    #storeAccessor;
    #nameLabel;
    #nameLink;
    #nameCostText;
    #countInput;
    #subtractButton;
    #addButton;

    constructor() {
        super();
        this.#nameLink = document.createElement('a');
        this.#nameCostText = document.createTextNode('');
        this.#nameLabel = document.createElement('label');
        this.#nameLabel.append(this.#nameLink, ' (', this.#nameCostText, ')');

        this.#countInput = document.createElement('input');
        this.#countInput.type = 'text';
        this.#countInput.value = 0;
        this.#countInput.addEventListener('change', () => {
            if (this.#countInput.value) {
                const newCount = parseInt(this.#countInput.value, 10);
                if (Number.isNaN(newCount)) {
                    this.#countInput.value = this.#storeAccessor.count;
                } else if (newCount < 0) {
                    this.#storeAccessor.count += newCount;
                } else {
                    this.#storeAccessor.count = newCount;
                }
            } else {
                this.#storeAccessor.count = 0;
            }
        });

        this.#subtractButton = document.createElement('button');
        this.#subtractButton.title = 'Decrease quantity';
        this.#subtractButton.ariaLabel = 'Decrease quantity';
        this.#subtractButton.textContent = '-';
        this.#subtractButton.addEventListener('click', () => {
            this.#storeAccessor.count--;
        });

        this.#addButton = document.createElement('button');
        this.#addButton.title = 'Increase quantity';
        this.#addButton.ariaLabel = 'Increase quantity';
        this.#addButton.textContent = '+';
        this.#addButton.addEventListener('click', () => {
            this.#storeAccessor.count++;
        });

        this.innerHTML = '';
        this.append(this.#nameLabel, this.#subtractButton, this.#countInput, this.#addButton);
    }

    initialize(item, store, currency) {
        this.#storeAccessor = store.getItemAccessor(item.id);

        this.#storeAccessor.subscribe((count) => {
            this.#countInput.value = count;
            if (count > 1) {
                this.#subtractButton.title = 'Decrease quantity';
                this.#subtractButton.ariaLabel = 'Decrease quantity';
                this.#subtractButton.textContent = '-';
            } else {
                this.#subtractButton.title = 'Remove from cart';
                this.#subtractButton.ariaLabel = 'Remove from cart';
                this.#subtractButton.textContent = 'X';
            }
        });

        if (store.readonly) {
            this.#subtractButton.disabled = true;
            this.#addButton.disabled = true;
            this.#countInput.readOnly = true;
        }

        const inputId = `sc-input-${item.id}`;
        this.#nameLabel.htmlFor = inputId;
        this.#nameLink.textContent = item.name;
        this.#nameLink.href = `#${item.id}`;
        this.#nameCostText.textContent = currency.formatCostByUnits(item.cost);
        this.#countInput.id = inputId;
    }
}

class ShoppingCart extends HTMLElement {
    constructor() {
        super();

        const config = JSON.parse(this.getAttribute('config'));
        const store = new ShoppingCartStore(config.items);
        const currency = new Currency(config.currency);

        const itemNodes = {};
        for (const item of store.enumerateItems()) {
            itemNodes[item.id] = new ShoppingCartItem();
            itemNodes[item.id].initialize(item, store, currency);
        }

        const emptyCartNode = document.createElement('span');
        emptyCartNode.textContent = 'The cart is empty!';

        this.innerHTML = `
            <button>View cart</button>
            <dialog closedby="any">
                <header>
                    <h1>Cart</h1>
                    <button title="Close" aria-label="Close">X</button>
                </header>
                <main>
                </main>
                <footer>
                    <div class="total-bar">
                        <span>Current Total:</span><span class="total"></span>
                    </div>
                    <div class="toolbar hidden">
                        <div class="cart-link">
                            <input type="text" class="link" name="link" title="Cart link" aria-label="Cart link" readonly>
                            <button class="copy-link">Copy link</button>
                        </div>
                        <button class="clear" disabled>Clear cart</button>
                    </div>
                </footer>
            </dialog>
        `;

        const cartDialog = this.querySelector('& > dialog');
        cartDialog.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                cartDialog.close();
            }
        });

        const viewCartButtonCount = document.createTextNode('');
        const viewCartBtn = this.querySelector('& > button');
        viewCartBtn.append(viewCartButtonCount);
        viewCartBtn.addEventListener('click', () => {
            cartDialog.showModal();
        });

        const closeButton = cartDialog.querySelector('& > header > button');
        closeButton.addEventListener('click', () => {
            cartDialog.close();
        });

        const toolbar = cartDialog.querySelector('.toolbar');
        const cartLink = toolbar.querySelector('.link');
        const copyLinkButton = toolbar.querySelector('.copy-link');
        copyLinkButton.addEventListener('click', () => {
            navigator.clipboard.writeText(cartLink.value);
        });
        const clearButton = toolbar.querySelector('button.clear');
        clearButton.addEventListener('click', () => {
            store.clearCart();
        });

        const mainSection = this.querySelector('main');
        const totalSpan = this.querySelector('.total');

        store.subscribeToCartUpdates(cartUpdate => {
            if (cartUpdate.action === 'init') {
                emptyCartNode.remove();
                mainSection.append(...cartUpdate.ids.map(id => itemNodes[id]));
                if (store.readonly) {
                    cartDialog.showModal();
                }
            } else if (cartUpdate.action === 'clear') {
                mainSection.innerHTML = '';
                mainSection.append(emptyCartNode);
            } else if (cartUpdate.action === 'add') {
                mainSection.append(itemNodes[cartUpdate.id]);
                emptyCartNode.remove();
            } else if (cartUpdate.action === 'remove') {
                itemNodes[cartUpdate.id].remove();
            }

            if (cartUpdate.count > 0) {
                emptyCartNode.remove();
                viewCartButtonCount.textContent = ` (${cartUpdate.count})`;
                if (store.storageEnabled) {
                    toolbar.classList.remove('hidden');
                    clearButton.disabled = false;

                    const url = new URL(window.location.href);
                    url.searchParams.set('cart', cartUpdate.encodedCart);
                    cartLink.value = url.toString();
                }
            } else {
                mainSection.append(emptyCartNode);
                viewCartButtonCount.textContent = '';
                toolbar.classList.add('hidden');
                cartLink.value = '';
                clearButton.disabled = true;
            }

            if (cartUpdate.cost === 0) {
                totalSpan.textContent = `0${currency.baseUnit}`;
            } else {
                totalSpan.textContent = currency.formatCostByUnits(cartUpdate.cost);
            }
        });
    }
}

window.customElements.define('shopping-item', ShoppingItem);
window.customElements.define('shopping-cart-item', ShoppingCartItem);
window.customElements.define('shopping-cart', ShoppingCart);
