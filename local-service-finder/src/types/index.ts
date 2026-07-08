export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Service {
  id: string;
  providerId: string;
  title: string;
  category: string;
  description: string;
  provider?: Provider;
}

export interface Provider {
  id: string;
  userId: string;
  bio: string;
  location: string;
  phone: string;
  profileImage: string;
  user?: User;
  services?: Service[];
}

export interface Review {
  id: string;
  customerId: string;
  providerId: string;
  bookingId: string;
  rating: number;
  comment: string;
  createdAt: string;
  customer?: User;
}

export interface Booking {
  id: string;
  customerId: string;
  providerId: string;
  serviceId: string;
  date: string;
  status: string; // 'Pending', 'Accepted', 'Rejected', 'Completed'
  customer?: User;
  provider?: Provider;
  service?: Service;
}
