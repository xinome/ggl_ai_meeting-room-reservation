// フロントエンドの型定義ファイル
export interface Room {
  id: string;
  name: string;
  capacity: number;
  equipment: string[];
}

export interface Reservation {
  id: string;
  roomId: string;
  userId: string; // 将来的にユーザー認証と連携
  startTime: string; // ISO 8601形式 (例: "2024-03-15T10:00:00.000Z")
  endTime: string;   // ISO 8601形式
  purpose: string;
}

export interface NewReservationData {
  roomId: string;
  userId: string;
  startTime: string;
  endTime: string;
  purpose: string;
}
