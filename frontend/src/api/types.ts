export type Office = {
  id: string;
  name: string;
  address: string;
  timezone: string;
};

export type RoomFeature = {
  code: string;
  name: string;
};

export type Room = {
  id: string;
  officeId: string;
  name: string;
  floor: number;
  capacity: number;
  features: RoomFeature[];
  office: Office;
  available?: boolean;
};

export type BookingRoom = {
  id: string;
  officeId: string;
  name: string;
  floor: number;
  capacity: number;
  features: RoomFeature[];
};

export type Booking = {
  id: string;
  roomId: string;
  title: string;
  comment: string | null;
  startsAt: string;
  endsAt: string;
  room: BookingRoom;
  office: Office;
};
