'use strict';

class Subscribers {
    #subscribers;

    constructor() {
        this.#subscribers = [];
    }

    add(subscriber) {
        if (typeof subscriber === 'function') {
            this.#subscribers.push(subscriber);
        }
    }

    notify(...args) {
        for (const subscriber of this.#subscribers) {
            subscriber(...args);
        }
    }
}

export default class ShoppingCartStore {
    #items;
    #itemsInCart;
    cartUpdateSubscribers;

    constructor(items) {
        this.#items = {};
        this.#itemsInCart = [];
        this.cartUpdateSubscribers = new Subscribers();

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

                subscribe: (subscriber) => item.subscribers.add(subscriber),
            };

            this.#items[id] = item;
        }

        document.addEventListener('add-to-cart', (e) => {
            this.getItemAccessor(e.target.id).count++;
        });
    }

    #updateCart(id) {
        const notification = {
            action: 'update',
            id,
            count: 0,
            cost: 0,
        };

        const idx = this.#itemsInCart.indexOf(id);
        const item = this.#items[id];
        if (item.count === 0 && idx > -1) {
            this.#itemsInCart.splice(idx, 1);
            notification.action = 'remove';
        } else if (item.count > 0 && idx === -1) {
            this.#itemsInCart.push(id);
            notification.action = 'add';
        }

        this.#itemsInCart.map(id => this.#items[id]).forEach(item => {
            notification.count += item.count;
            notification.cost += item.count * item.cost;
        });

        this.cartUpdateSubscribers.notify(notification);
    }

    *enumerateItems() {
        for (const [id, item] of Object.entries(this.#items)) {
            yield Object.freeze({
                id,
                name: item.name,
                cost: item.cost,
                count: item.count,
            });
        }
    }

    getItemAccessor(id) {
        if (!(id in this.#items)) {
            throw new Error(`Cannot get item accessor for unknown item "${id}"`);
        }

        return this.#items[id].accessor;
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

        const addButton = document.createElement('button');
        addButton.title = 'Increase quantity';
        addButton.ariaLabel = 'Increase quantity';
        addButton.textContent = '+';
        addButton.addEventListener('click', () => {
            this.#storeAccessor.count++;
        });

        this.innerHTML = '';
        this.append(this.#nameLabel, this.#subtractButton, this.#countInput, addButton);
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

        const inputId = `sc-input-${item.id}`;
        this.#nameLabel.htmlFor = inputId;
        this.#nameLink.textContent = item.name;
        this.#nameLink.href = `#${item.id}`;
        this.#nameCostText.textContent = currency.formatCostByUnits(item.cost);
        this.#countInput.value = item.count;
        this.#countInput.id = inputId;
    }
}

class ShoppingCart extends HTMLElement {
    #store;
    #currency;
    #itemNodes;
    #emptyCartNode;
    #mainSection;
    #totalSpan;
    #viewCartButtonCount;

    constructor() {
        super();

        const config = JSON.parse(this.getAttribute('config'));
        this.#store = new ShoppingCartStore(config.items);
        this.#currency = new Currency(config.currency);

        this.#itemNodes = {};
        for (const item of this.#store.enumerateItems()) {
            this.#itemNodes[item.id] = new ShoppingCartItem();
            this.#itemNodes[item.id].initialize(item, this.#store, this.#currency);
        }

        this.#emptyCartNode = document.createElement('span');
        this.#emptyCartNode.textContent = 'The cart is empty!';
        this.#viewCartButtonCount = document.createTextNode('');

        this.#store.cartUpdateSubscribers.add(({ action, id, count, cost }) => {
            if (action === 'add') {
                this.#mainSection.append(this.#itemNodes[id]);
                this.#emptyCartNode.remove();
            } else if (action === 'remove') {
                this.#itemNodes[id].remove();
            }

            if (count > 0) {
                this.#emptyCartNode.remove();
                this.#viewCartButtonCount.textContent = ` (${count})`;
            } else {
                this.#mainSection.append(this.#emptyCartNode);
                this.#viewCartButtonCount.textContent = '';
            }

            if (cost === 0) {
                this.#totalSpan.textContent = `0${this.#currency.baseUnit}`;
            } else {
                this.#totalSpan.textContent = this.#currency.formatCostByUnits(cost);
            }
        });

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
                    <span>Current Total:</span><span id="cart-total"></span>
                </footer>
            </dialog>
        `;

        const cartDialog = this.querySelector('& > dialog');
        const viewCartBtn = this.querySelector('& > button');
        viewCartBtn.append(this.#viewCartButtonCount);
        viewCartBtn.addEventListener('click', () => {
            cartDialog.showModal();
        });

        const closeButton = cartDialog.querySelector('& > header > button');
        closeButton.addEventListener('click', () => {
            cartDialog.close();
        });

        this.#mainSection = this.querySelector('main');
        this.#mainSection.append(this.#emptyCartNode);
        this.#totalSpan = this.querySelector('#cart-total');
        this.#totalSpan.textContent = `0${this.#currency.baseUnit}`;

        cartDialog.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                cartDialog.close();
            }
        });
    }
}

window.customElements.define('shopping-item', ShoppingItem);
window.customElements.define('shopping-cart-item', ShoppingCartItem);
window.customElements.define('shopping-cart', ShoppingCart);
