import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  User as UserIcon,
  LogOut,
  Plus,
  Minus,
  Trash2,
  Package,
  CheckCircle,
  AlertCircle,
  LayoutDashboard,
  ShoppingCart,
  UserCircle,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token'),
  );
  const [view, setView] = useState<
    'products' | 'cart' | 'profile' | 'login' | 'register' | 'dashboard'
  >('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [authError, setAuthError] = useState('');
  const [checkoutStatus, setCheckoutStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');

  // Auth Inputs
  const [authInputs, setAuthInputs] = useState({
    identifier: '',
    username: '',
    email: '',
    password: '',
    name: '',
  });
  const [profileInputs, setProfileInputs] = useState({
    name: '',
    username: '',
    email: '',
  });

  useEffect(() => {
    if (token) {
      fetchUser();
      fetchProducts();
    } else {
      setView('login');
    }
  }, [token]);

  const fetchUser = () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setProfileInputs({
        name: parsed.name || '',
        username: parsed.username,
        email: parsed.email,
      });
    }
  };

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: authInputs.identifier,
        password: authInputs.password,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setView('products');
    } else {
      setAuthError(data.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authInputs),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setView('products');
    } else {
      setAuthError(data.error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setCart([]);
    setView('login');
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }),
    );
  };

  const handleCheckout = async () => {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      }),
    });
    if (res.ok) {
      setCheckoutStatus('success');
      setCart([]);
      fetchProducts();
    } else {
      setCheckoutStatus('error');
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileInputs),
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      alert('Profile updated successfully!');
    }
  };

  const total = cart.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0,
  );

  if (!token && view !== 'login' && view !== 'register') {
    return null; // Effect will handle redirect
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navigation */}
      {token && (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setView('products')}
              >
                <Package className="w-8 h-8 text-indigo-600" />
                <span className="font-bold text-xl tracking-tight">
                  LaraNode Pro
                </span>
              </div>

              <div className="flex items-center gap-6">
                {/* // TODO: FITUR TAMBAHAN - DASHBOARD UI (Commented out for Demo)
                 */}
                {/* <button
                  onClick={() => setView('dashboard' as any)}
                  className={`flex items-center gap-1 text-sm font-medium transition-colors ${view === 'dashboard' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </button> */}
                <button
                  onClick={() => setView('products')}
                  className={`flex items-center gap-1 text-sm font-medium transition-colors ${view === 'products' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Products
                </button>
                <button
                  onClick={() => setView('cart')}
                  className={`flex items-center gap-1 text-sm font-medium relative transition-colors ${view === 'cart' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Cart
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setView('profile')}
                  className={`flex items-center gap-1 text-sm font-medium transition-colors ${view === 'profile' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
                >
                  <UserCircle className="w-4 h-4" />
                  Profile
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Login View */}
          {view === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-xl shadow-indigo-100 border border-slate-100 mt-12"
            >
              <div className="text-center mb-8">
                <Package className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-slate-900">
                  Welcome Back
                </h2>
                <p className="text-slate-500">
                  Sign in to manage your products
                </p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Email or Username
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="demo@example.com"
                    value={authInputs.identifier}
                    onChange={(e) =>
                      setAuthInputs({
                        ...authInputs,
                        identifier: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="••••••••"
                    value={authInputs.password}
                    onChange={(e) =>
                      setAuthInputs({ ...authInputs, password: e.target.value })
                    }
                  />
                </div>
                {authError && (
                  <div className="text-red-500 text-sm font-medium flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {authError}
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transform transition-all active:scale-[0.98] shadow-lg shadow-indigo-200"
                >
                  Sign In
                </button>
              </form>
              <div className="mt-6 text-center">
                <button
                  onClick={() => setView('register')}
                  className="text-indigo-600 hover:underline text-sm font-medium"
                >
                  Don't have an account? Create one
                </button>
              </div>
            </motion.div>
          )}
          {/* Register View */}
          {view === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-xl shadow-indigo-100 border border-slate-100 mt-12"
            >
              <h2 className="text-3xl font-bold text-center mb-2">
                Create Account
              </h2>
              <p className="text-slate-500 text-center mb-8">
                Join LaraNode Pro today
              </p>
              <form onSubmit={handleRegister} className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  value={authInputs.name}
                  onChange={(e) =>
                    setAuthInputs({ ...authInputs, name: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Username"
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  value={authInputs.username}
                  onChange={(e) =>
                    setAuthInputs({ ...authInputs, username: e.target.value })
                  }
                />
                <input
                  type="email"
                  placeholder="Email"
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  value={authInputs.email}
                  onChange={(e) =>
                    setAuthInputs({ ...authInputs, email: e.target.value })
                  }
                />
                <input
                  type="password"
                  placeholder="Password"
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  value={authInputs.password}
                  onChange={(e) =>
                    setAuthInputs({ ...authInputs, password: e.target.value })
                  }
                />
                {authError && (
                  <div className="text-red-500 text-sm font-medium">
                    {authError}
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                >
                  Register
                </button>
              </form>
              <button
                onClick={() => setView('login')}
                className="w-full mt-4 text-indigo-600 hover:underline text-sm font-medium"
              >
                Already have an account? Sign in
              </button>
            </motion.div>
          )}
          {/* Product Listing */}
          {view === 'products' && (
            <motion.div
              key="products"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              <div className="col-span-full mb-4">
                <h1 className="text-2xl font-bold text-slate-900">
                  Explore Products
                </h1>
                <p className="text-slate-500">
                  Premium selection for your needs
                </p>
              </div>
              {products.map((p) => (
                <motion.div
                  layoutId={p.id}
                  key={p.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow group flex flex-col h-full"
                >
                  <div className="aspect-square bg-slate-100 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                    <ShoppingBag className="w-12 h-12 text-slate-300 group-hover:text-indigo-300" />
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-slate-500 text-sm mt-1 line-clamp-2 flex-grow">
                      {p.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-lg font-bold text-indigo-600">
                        ${p.price}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        Stock: {p.stock}
                      </span>
                    </div>
                    <button
                      onClick={() => addToCart(p)}
                      disabled={p.stock <= 0}
                      className="mt-4 w-full bg-indigo-600 text-white text-sm font-bold py-2 rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add to Cart
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
          {/* Cart View */}
          {view === 'cart' && (
            <motion.div
              key="cart"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-3xl font-bold mb-8">Your Cart</h2>
              {cart.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl text-center border border-dashed border-slate-300">
                  {checkoutStatus === 'success' ? (
                    <div className="space-y-4">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                      <h3 className="text-xl font-bold">
                        Order Placed Successfully!
                      </h3>
                      <button
                        onClick={() => {
                          setView('products');
                          setCheckoutStatus('idle');
                        }}
                        className="text-indigo-600 font-bold hover:underline"
                      >
                        Continue Shopping
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <ShoppingCart className="w-16 h-16 text-slate-200 mx-auto" />
                      <p className="text-slate-500">Your cart is empty</p>
                      <button
                        onClick={() => setView('products')}
                        className="bg-indigo-600 text-white font-bold px-8 py-2 rounded-lg"
                      >
                        Start Shopping
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-4">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4"
                      >
                        <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center">
                          <ShoppingBag className="w-8 h-8 text-slate-300" />
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-bold">{item.product.name}</h4>
                          <p className="text-indigo-600 font-bold">
                            ${item.product.price}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="p-1 rounded-md border border-slate-200 hover:bg-slate-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-bold w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="p-1 rounded-md border border-slate-200 hover:bg-slate-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 h-fit space-y-4 sticky top-24">
                    <h3 className="text-xl font-bold border-bottom border-slate-100 pb-4">
                      Order Summary
                    </h3>
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Shipping</span>
                      <span>Free</span>
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center bg-transparent">
                      <span className="font-bold text-lg">Total</span>
                      <span className="font-bold text-2xl text-indigo-600">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={handleCheckout}
                      className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] mt-4"
                    >
                      Complete Checkout
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
          {/* Profile View */}
          {view === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-200"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                  <UserIcon className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Profile Settings</h2>
                  <p className="text-slate-500 text-sm">
                    Manage your account information
                  </p>
                </div>
              </div>
              <form onSubmit={updateProfile} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-transparent">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={profileInputs.name}
                      onChange={(e) =>
                        setProfileInputs({
                          ...profileInputs,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg h-fit focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={profileInputs.username}
                      onChange={(e) =>
                        setProfileInputs({
                          ...profileInputs,
                          username: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={profileInputs.email}
                    onChange={(e) =>
                      setProfileInputs({
                        ...profileInputs,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 bg-transparent">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white font-bold px-8 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          )}
          {/* // TODO: FITUR TAMBAHAN - DASHBOARD UI (Commented out for Demo)
           */}
          {/* {view === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold">Business Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-transparent">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-slate-500 text-sm">Total User Terdaftar</p>
                  <p className="text-4xl font-black text-slate-900">10</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-slate-500 text-sm">Total Penjualan</p>
                  <p className="text-4xl font-black text-indigo-600 text-center bg-transparent">
                    $0.00
                  </p>
                </div>
              </div>
            </motion.div>
          )} */}
        </AnimatePresence>
      </main>
    </div>
  );
}
