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
