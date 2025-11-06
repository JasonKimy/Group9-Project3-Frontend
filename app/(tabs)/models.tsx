export interface Place {
  id: string;
  name: string;
  address: string;
  photoUrl?: string;
  visited?: boolean;
}

export interface Deck {
  id: string;
  name: string;
  places: Place[];
}
