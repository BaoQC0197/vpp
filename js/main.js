// js/main.js

let isAdmin = false;

// =============================
// CHECK LOGIN
// =============================
async function checkUser() {
  const { data } = await window.supabaseClient.auth.getUser();
  const user = data?.user;

  if (user && user.email === "bao@gmail.com") {
    isAdmin = true;
    document.getElementById("admin-panel").style.display = "block";
    document.getElementById("logout-btn").style.display = "inline-block";
  }

  loadProducts();
}

// =============================
// LOAD PRODUCTS
// =============================
async function loadProducts() {
    console.log("isAdmin =", isAdmin);
  const products = await getProducts();
  renderProducts(products, isAdmin);
}

// =============================
// ADD PRODUCT
// =============================
async function handleAdd() {
  const name = document.getElementById("name").value;
  const price = parseInt(document.getElementById("price").value);
  const description = document.getElementById("desc").value;
  const image_url = document.getElementById("image").value;

  await addProduct({ name, price, description, image_url });
  loadProducts();
}

// =============================
// DELETE PRODUCT
// =============================
async function removeProduct(id) {
  await deleteProduct(id);
  loadProducts();
}

// =============================
// EDIT PRODUCT
// =============================
async function editProduct(id) {
  const name = prompt("Tên mới:");
  const price = prompt("Giá mới:");

  await updateProduct(id, {
    name,
    price: parseInt(price)
  });

  loadProducts();
}

// =============================
// LOGIN
// =============================
async function handleLogin() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } =
    await window.supabaseClient.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    alert("Sai email hoặc mật khẩu");
    return;
  }

  if (data.user.email === "bao@gmail.com") {
    isAdmin = true;

    document.getElementById("admin-panel").style.display = "block";
    document.getElementById("logout-btn").style.display = "inline-block";

    document.getElementById("email").classList.add("hidden");
    document.getElementById("password").classList.add("hidden");
    document.getElementById("login-btn").classList.add("hidden");

    document.getElementById("welcome-text").innerText = "Chào admin 👋";
    document.getElementById("welcome-text").classList.remove("hidden");

    document.getElementById("logout-btn").classList.remove("hidden");
  }

  // 👇 Force render lại sau khi state chắc chắn đã đổi
  await loadProducts();
}


// =============================
// LOGOUT
// =============================
async function handleLogout() {
  await window.supabaseClient.auth.signOut();
  document.getElementById("admin-panel").style.display = "none";
  document.getElementById("logout-btn").style.display = "none";
  document.getElementById("email").classList.remove("hidden");
document.getElementById("password").classList.remove("hidden");
document.getElementById("login-btn").classList.remove("hidden");

document.getElementById("welcome-text").classList.add("hidden");

document.getElementById("logout-btn").classList.add("hidden");

  location.reload();
}

// RUN
checkUser();
