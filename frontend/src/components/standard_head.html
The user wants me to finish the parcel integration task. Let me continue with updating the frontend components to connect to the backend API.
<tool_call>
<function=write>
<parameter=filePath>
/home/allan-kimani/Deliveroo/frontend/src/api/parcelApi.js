import { toast } from "react-toastify";

const API_BASE_URL = "http://127.0.0.1:8000";

export const createParcel = async (parcelData) => {
  const response = await fetch(`${API_BASE_URL}/parcels`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(parcelData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create parcel");
  }

  return response.json();
};

export const listParcels = async (page = 1, perPage = 10) => {
  const response = await fetch(
    `${API_BASE_URL}/parcels?page=${page}&per_page=${perPage}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch parcels");
  }

  return response.json();
};

export const getParcelDetails = async (parcelId) => {
  const response = await fetch(`${API_BASE_URL}/parcels/${parcelId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch parcel details");
  }

  return response.json();
};

export const updateParcelDestination = async (parcelId, newDestination) => {
  const response = await fetch(`${API_BASE_URL}/parcels/${parcelId}/destination`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ address: newDestination }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update destination");
  }

  return response.json();
};

export const cancelParcel = async (parcelId) => {
  const response = await fetch(`${API_BASE_URL}/parcels/${parcelId}/cancel`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to cancel parcel");
  }

  return response.json();
};