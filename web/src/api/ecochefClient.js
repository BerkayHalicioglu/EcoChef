const BASE_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000';

export async function getRandomRecipes(count = 3) {
  const res = await fetch(`${BASE_URL}/recipes/random?count=${count}`);
  if (!res.ok) throw new Error('Failed to fetch recipes');
  return res.json();
}
