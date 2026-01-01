'use strict';

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
    #id;
    #cost;
    #nameLabel;
    #nameLink;
    #nameCostText;
    #count;
    #countInput;
    #subtractButton;

    constructor() {
        super();
        this.#nameLink = document.createElement('a');
        this.#nameCostText = document.createTextNode('');
        this.#nameLabel = document.createElement('label');
        this.#nameLabel.append(this.#nameLink, ' (', this.#nameCostText, ')');

        this.#count = 0;
        this.#countInput = document.createElement('input');
        this.#countInput.type = 'text';
        this.#countInput.value = 0;
        this.#countInput.addEventListener('change', () => {
            if (this.#countInput.value) {
                const newCount = parseInt(this.#countInput.value, 10);
                if (Number.isNaN(newCount)) {
                    this.#countInput.value = this.count;
                } else if (newCount < 0) {
                    this.count += newCount;
                } else {
                    this.count = newCount;
                }
            } else {
                this.count = 0;
            }
        });

        this.#subtractButton = document.createElement('button');
        this.#subtractButton.title = 'Decrease quantity';
        this.#subtractButton.ariaLabel = 'Decrease quantity';
        this.#subtractButton.textContent = '-';
        this.#subtractButton.addEventListener('click', () => {
            this.count--;
        });

        const addButton = document.createElement('button');
        addButton.title = 'Increase quantity';
        addButton.ariaLabel = 'Increase quantity';
        addButton.textContent = '+';
        addButton.addEventListener('click', () => {
            this.count++;
        });

        this.innerHTML = '';
        this.append(this.#nameLabel, this.#subtractButton, this.#countInput, addButton);

        document.addEventListener('add-to-cart', (e) => {
            if (e.target.id === this.#id) {
                this.count++;
            }
        });
    }

    setItemInfo(id, { name, cost }, currency) {
        const inputId = `sc-input-${id}`;

        this.#id = id;
        this.#cost = cost;
        this.#nameLabel.htmlFor = inputId;
        this.#nameLink.textContent = name;
        this.#nameLink.href = `#${id}`;
        this.#nameCostText.textContent = currency.formatCostByUnits(cost);
        this.#countInput.id = inputId;
    }

    get cost() {
        return this.#cost;
    }

    get count() {
        return this.#count;
    }

    set count(value) {
        this.#count = value;
        this.#countInput.value = value;
        if (value > 1) {
            this.#subtractButton.title = 'Decrease quantity';
            this.#subtractButton.ariaLabel = 'Decrease quantity';
            this.#subtractButton.textContent = '-';
        } else {
            this.#subtractButton.title = 'Remove from cart';
            this.#subtractButton.ariaLabel = 'Remove from cart';
            this.#subtractButton.textContent = 'X';
        }
        this.dispatchEvent(new CustomEvent('shopping-cart-item-count-updated'));
    }
}

class ShoppingCart extends HTMLElement {
    #config;
    #currency;
    #items;
    #itemsInCart;
    #emptyCartNode;
    #mainSection;
    #totalSpan;
    #viewCartButtonCount;

    constructor() {
        super();

        this.#config = JSON.parse(this.getAttribute('config'));
        this.#currency = new Currency(this.#config.currency);
        this.#itemsInCart = [];
        this.#emptyCartNode = document.createElement('span');
        this.#emptyCartNode.textContent = 'The cart is empty!';
        this.#viewCartButtonCount = document.createTextNode('');

        this.#items = {};
        Object.entries(this.#config.items).forEach(([key, value]) => {
            this.#items[key] = new ShoppingCartItem();
            this.#items[key].setItemInfo(key, value, this.#currency);
            this.#items[key].addEventListener('shopping-cart-item-count-updated', (e) => {
                this.handleItemUpdated(e.target);
            });
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

        this.append(viewCartBtn, cartDialog);
    }

    handleItemUpdated(item) {
        if (item.count > 0 && !item.isConnected) {
            this.#itemsInCart.push(item);
            this.#mainSection.append(item);
            this.#emptyCartNode.remove();
        } else if (item.count <= 0) {
            item.remove();
            const idx = this.#itemsInCart.indexOf(item);
            if (idx > -1) {
                this.#itemsInCart.splice(idx, 1);
                if (this.#itemsInCart.length === 0) {
                    this.#mainSection.append(this.#emptyCartNode);
                }
            }
        }

        let totalCost = 0;
        let totalCount = 0;
        for (const itemInCart of this.#itemsInCart) {
            totalCost += itemInCart.count * itemInCart.cost;
            totalCount += itemInCart.count;
        }

        if (totalCost === 0) {
            this.#totalSpan.textContent = `0${this.#currency.baseUnit}`;
        } else {
            this.#totalSpan.textContent = this.#currency.formatCostByUnits(totalCost);
        }

        if (totalCount === 0) {
            this.#viewCartButtonCount.textContent = '';
        } else {
            this.#viewCartButtonCount.textContent = ` (${totalCount})`;
        }
    }

    addItemToCart(itemId) {
        if (!(itemId in this.#items)) {
            console.warn(`[ShoppingCart] Unknown item ${itemId}`);
            return;
        }

        const item = this.#items[itemId];
        item.count++;
        if (!item.isAttached) {
            this.#itemsInCart.push(item);
            this.#emptyCartNode.remove();
            this.#mainSection.append(item);
        }
    }
}

window.customElements.define('shopping-item', ShoppingItem);
window.customElements.define('shopping-cart-item', ShoppingCartItem);
window.customElements.define('shopping-cart', ShoppingCart);
