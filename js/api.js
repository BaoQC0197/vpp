// js/api.js

async function getProducts() {
  const { data, error } = await window.supabaseClient
    .from("products")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

async function addProduct(product) {
  await window.supabaseClient
    .from("products")
    .insert([product]);
}

async function deleteProduct(id) {
  await window.supabaseClient
    .from("products")
    .delete()
    .eq("id", id);
}

async function updateProduct(id, updatedData) {
  await window.supabaseClient
    .from("products")
    .update(updatedData)
    .eq("id", id);
}
