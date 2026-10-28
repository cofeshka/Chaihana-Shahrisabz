const cart = new Map();

window.addEventListener('load', () => {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
});
const cartPanel = document.querySelector('#cart-panel');
const cartOverlay = document.querySelector('#cart-overlay');
const cartItems = document.querySelector('#cart-items');
const cartCount = document.querySelector('#cart-count');
const cartTotal = document.querySelector('#cart-total');
const cartPanelTotal = document.querySelector('#cart-panel-total');
const cartOpen = document.querySelector('#cart-open');
const cartClose = document.querySelector('#cart-close');
const checkout = document.querySelector('#checkout');
const phoneInput = document.querySelector('input[name="phone"]');
const yandexOrderLinks = document.querySelectorAll('[data-yandex-order]');
const yandexOrderUrl = '';

yandexOrderLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    if (!yandexOrderUrl) {
      event.preventDefault();
      alert('Ссылка на заказ через Яндекс Еду пока не добавлена.');
      return;
    }
    link.href = yandexOrderUrl;
  });
});
const orderModal = document.querySelector('#order-modal');
const orderClose = document.querySelector('.pickup-close');
const orderForm = document.querySelector('#order-form');
const orderSummary = document.querySelector('#order-summary');
const formStatus = document.querySelector('#form-status');
const orderToast = document.querySelector('#order-toast');
const toastText = document.querySelector('#toast-text');
const toastClose = document.querySelector('#toast-close');
const burger = document.querySelector('#burger');
const mobileMenu = document.querySelector('#mobile-menu');

function money(value) {
  return `${value.toLocaleString('ru-RU')} ₽`;
}

function updateCart() {
  const items = [...cart.values()];
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartCount.textContent = count;
  cartTotal.textContent = money(total);
  cartPanelTotal.textContent = money(total);

  if (!items.length) {
    cartItems.innerHTML = '<div class="empty-cart">Корзина пока пуста.<br>Добавьте любимые блюда.</div>';
    return;
  }

  cartItems.innerHTML = items.map((item) => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}">
      <div>
        <h3>${item.name}</h3>
        <p>${money(item.price)} за порцию</p>
        <div class="cart-item-actions">
          <button type="button" data-cart-action="decrease" data-name="${item.name}" aria-label="Уменьшить количество">−</button>
          <span>${item.quantity}</span>
          <button type="button" data-cart-action="increase" data-name="${item.name}" aria-label="Увеличить количество">+</button>
        </div>
      </div>
      <strong class="cart-item-total">${money(item.price * item.quantity)}</strong>
    </div>
  `).join('');
}

function addToCart(button) {
  const { name, price, image } = button.dataset;
  const item = cart.get(name) || { name, price: Number(price), image, quantity: 0 };
  item.quantity += 1;
  cart.set(name, item);
  updateCart();
  button.textContent = 'Добавлено';
  setTimeout(() => { button.textContent = 'Добавить'; }, 900);
}

document.querySelectorAll('.add-button').forEach((button) => {
  button.addEventListener('click', () => addToCart(button));
});

cartItems.addEventListener('click', (event) => {
  const button = event.target.closest('[data-cart-action]');
  if (!button) return;
  const item = cart.get(button.dataset.name);
  if (!item) return;
  if (button.dataset.cartAction === 'increase') item.quantity += 1;
  if (button.dataset.cartAction === 'decrease') item.quantity -= 1;
  if (item.quantity <= 0) cart.delete(item.name);
  updateCart();
});

function openCart() {
  cartPanel.classList.add('open');
  cartOverlay.classList.add('open');
  cartPanel.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartPanel.classList.remove('open');
  cartOverlay.classList.remove('open');
  cartPanel.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

cartOpen.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  const normalized = digits[0] === '8' ? `7${digits.slice(1)}` : digits.startsWith('7') ? digits : `7${digits}`;
  const body = normalized.slice(1);
  let result = '+7';
  if (body.length) result += ` (${body.slice(0, 3)}`;
  if (body.length >= 3) result += ')';
  if (body.length > 3) result += ` ${body.slice(3, 6)}`;
  if (body.length > 6) result += `-${body.slice(6, 8)}`;
  if (body.length > 8) result += `-${body.slice(8, 10)}`;
  return result;
}

phoneInput?.addEventListener('input', () => {
  phoneInput.value = formatPhone(phoneInput.value);
});

phoneInput?.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey || event.key.length > 1) return;
  if (!/[0-9]/.test(event.key)) event.preventDefault();
});

function showOrderToast(name, pickupTime) {
  const greeting = name ? `${name}, ` : '';
  toastText.textContent = `${greeting}ваш заказ оформлен на самовывоз к ${pickupTime}. Мы перезвоним для подтверждения.`;
  orderToast.classList.add('show');
  orderToast.setAttribute('aria-hidden', 'false');
  clearTimeout(showOrderToast.timer);
  showOrderToast.timer = setTimeout(hideOrderToast, 12000);
}

function hideOrderToast() {
  orderToast.classList.remove('show');
  orderToast.setAttribute('aria-hidden', 'true');
  clearTimeout(showOrderToast.timer);
}

function resetOrderModal() {
  orderForm.hidden = false;
  orderSummary.hidden = false;
  orderForm.reset();
  formStatus.textContent = '';
  formStatus.classList.remove('success');
}

function openOrderForm() {
  if (!cart.size) {
    alert('Сначала добавьте блюда в корзину.');
    return;
  }
  resetOrderModal();
  const items = [...cart.values()];
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  orderSummary.textContent = `${items.map((item) => `${item.name} × ${item.quantity}`).join(', ')} — ${money(total)}`;
  orderModal.classList.add('open');
  orderModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  orderForm.querySelector('input')?.focus();
}

function closeOrderForm() {
  orderModal.classList.remove('open');
  orderModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  closeCart();
  resetOrderModal();
}

checkout.addEventListener('click', openOrderForm);
orderClose.addEventListener('click', closeOrderForm);
orderModal.addEventListener('click', (event) => {
  if (event.target === orderModal) closeOrderForm();
});

orderForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!cart.size) return;
  const submitButton = orderForm.querySelector('button[type="submit"]');
  const items = [...cart.values()];
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const formData = new FormData(orderForm);
  const payload = {
    customer: {
      name: formData.get('name').trim(),
      phone: formData.get('phone').trim(),
      pickupTime: formData.get('pickupTime'),
      comment: formData.get('comment').trim()
    },
    items: items.map(({ name, price, quantity }) => ({ name, price, quantity })),
    total,
    createdAt: new Date().toISOString()
  };

  submitButton.disabled = true;
  submitButton.textContent = 'Отправляем...';
  formStatus.textContent = '';

  try {
    // Пока приём заказов не подключён: сохраняем заявку локально, чтобы она не потерялась.
    // Когда появится реальный endpoint (Telegram-бот / Google Sheets / Formspree),
    // замените saveOrderLocally() на fetch(...) в этот try-блок.
    saveOrderLocally(payload);
    cart.clear();
    updateCart();
    closeOrderForm();
    showOrderToast(payload.customer.name, payload.customer.pickupTime);
  } catch (error) {
    formStatus.textContent = 'Не удалось отправить заказ. Позвоните нам: +7 (986) 112-77-77';
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Отправить заказ <b>→</b>';
  }
});

toastClose?.addEventListener('click', hideOrderToast);

function closeMobileMenu() {
  burger?.classList.remove('open');
  mobileMenu?.classList.remove('open');
  burger?.setAttribute('aria-expanded', 'false');
  mobileMenu?.setAttribute('aria-hidden', 'true');
}

burger?.addEventListener('click', () => {
  const isOpen = burger.classList.contains('open');
  if (isOpen) {
    closeMobileMenu();
  } else {
    burger.classList.add('open');
    mobileMenu.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    mobileMenu.setAttribute('aria-hidden', 'false');
  }
});

mobileMenu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeMobileMenu);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeCart();
    closeOrderForm();
    closeMobileMenu();
    hideOrderToast();
  }
});

function saveOrderLocally(order) {
  try {
    const key = 'shahrisabz_orders';
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    stored.push(order);
    localStorage.setItem(key, JSON.stringify(stored));
  } catch (error) {
    console.warn('Не удалось сохранить заказ локально:', error);
  }
}

document.querySelectorAll('.categories button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelector('.categories button.active')?.classList.remove('active');
    button.classList.add('active');
    const filter = button.dataset.filter;
    document.querySelectorAll('.dish-card').forEach((card) => {
      card.hidden = filter !== 'all' && card.dataset.category !== filter;
    });
  });
});

updateCart();
