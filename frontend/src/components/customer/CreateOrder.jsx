import React, { useState } from "react";
import { toast } from "react-toastify";

const CreateOrder = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const form = e.target;
    const formData = {
      user_id: localStorage.getItem("userId") || "user-123",
      pickup_location: {
        address: form.pickup_address.value,
      },
      destination: {
        address: form.destination_address.value,
      },
      weight: parseFloat(form.weight.value),
      weight_category: form.weight_category.value,
    };

    try {
      await createParcel(formData);
      setSuccess(true);
      toast.success("Parcel order created successfully!");
      form.reset();
    } catch (error) {
      toast.error(error.message || "Failed to create parcel");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="create-order-container p-6 bg-gray-50 min-h-screen">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Order Created</h1>
          <p className="text-gray-600">Your delivery order has been placed successfully.</p>
        </header>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-grow space-y-6">
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7h20l-8 5V7zm0 4l-8 5 2 8-10-2 2-8L12 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Parcel Created</p>
                    <p className="text-sm text-gray-500">Tracking number assigned</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="w-full lg:w-1/3">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 sticky top-6">
              <h2 className="text-lg font-semibold mb-4">Next Steps</h2>
              <p className="text-sm text-gray-500 mb-4">
                Your parcel is now being processed. You can track it using your order ID.
              </p>
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded transition-colors mb-4"
                onClick={() => setSuccess(false)}
              >
                Back to Orders
              </button>
              <p className="text-xs text-gray-400 text-center">
                By placing the order you agree to our Terms of Service.
              </p>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="create-order-container p-6 bg-gray-50 min-h-screen">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Create Delivery Order</h1>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Form Sections */}
        <div className="flex-grow space-y-6">
          {/* 1. Pickup Details */}
          <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4">1. Pickup Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address</label>
                <input
                  type="text"
                  placeholder="Quickmart Moi Avenue"
                  className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                  name="pickup_address"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                  <input
                    type="text"
                    placeholder="Joel Munywoki"
                    className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+254712345678"
                    className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 2. Destination Details */}
          <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4">2. Destination Details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
              <input
                type="text"
                placeholder="Nyayo Estate Embakasi Gate D"
                className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                name="destination_address"
              />
            </div>
          </section>

          {/* 3. Package Information */}
          <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4">3. Package Information</h2>
            <div className="flex items-center gap-6">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight Range</label>
                <select
                  className="w-full border border-gray-300 rounded p-2 bg-white focus:ring-blue-500 focus:border-blue-500"
                  name="weight_category"
                >
                  <option>Medium (2 - 5 kg)</option>
                  <option>Light (Under 2 kg)</option>
                  <option>Heavy (5 - 10 kg)</option>
                </select>
              </div>
              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  id="fragile"
                  className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  defaultChecked />
                <label htmlFor="fragile" className="text-sm font-medium text-gray-700">
                  Yes, handle with care
                </label>
              </div>
            </div>
          </section>
        </div>

        {/* Order Summary Sidebar */}
        <aside className="w-full lg:w-1/3">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            
            <div className="flex items-center justify-between text-sm text-gray-600 mb-6 bg-gray-50 p-3 rounded">
              <span className="font-medium text-gray-800">Quickmart MA</span>
              <span className="flex-grow border-t border-dashed border-blue-400 mx-2"></span>
              <span className="font-medium text-gray-800">Nyayo Estate Emb</span>
            </div>

            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Standard Delivery</span>
                <span>Kes 600</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Fragile Handling Charge</span>
                <span>Kes 200</span>
              </div>
              <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t border-gray-100">
                <span>Total Cost Estimate</span>
                <span className="text-blue-600">Kes 800</span>
              </div>
            </div>

            <button
              onClick={handleCreate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded transition-colors mb-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Sending...
                </>
              ) : (
                "Place Order"
              )}
            </button>
            <p className="text-xs text-gray-400 text-center">
              By placing the order you agree to our Terms of Service.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CreateOrder;