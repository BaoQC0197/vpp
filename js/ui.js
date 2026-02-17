function renderProducts(products, isAdmin) {
  const list = document.getElementById("product-list");
  list.innerHTML = "";

  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";

    let adminHTML = "";

    if (isAdmin) {
      adminHTML = `
        <div class="admin-actions">
          <button class="btn-edit">Sửa</button>
          <button class="btn-delete">Xoá</button>
        </div>
      `;
    }

    card.innerHTML = `
      <img src="${p.image_url}" />
      <div class="card-content">
        <h3>${p.name}</h3>
        <div class="price">${p.price.toLocaleString()} đ</div>
        <p>${p.description}</p>
        ${adminHTML}
      </div>
    `;

    if (isAdmin) {
      card.querySelector(".btn-edit").onclick = () => editProduct(p.id);
      card.querySelector(".btn-delete").onclick = () => removeProduct(p.id);
    }

    list.appendChild(card);
  });
}
