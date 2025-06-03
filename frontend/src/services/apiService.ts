// APIサービスの実装
import axios from 'axios';
import type { Room, Reservation, NewReservationData } from '@/types';

const API_BASE_URL = 'http://localhost:3001/api'; // バックエンドのURL

export default {
  async getRooms(): Promise<Room[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/rooms`);
      return response.data;
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return [];
    }
  },

  async getRoomById(roomId: string): Promise<Room | null> {
    try {
      const response = await axios.get(`${API_BASE_URL}/rooms/${roomId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching room ${roomId}:`, error);
      return null;
    }
  },

  async getReservations(roomId?: string, date?: string): Promise<Reservation[]> {
    try {
      let url = `${API_BASE_URL}/reservations`;
      const params = new URLSearchParams();
      if (roomId) params.append('roomId', roomId);
      if (date) params.append('date', date); // YYYY-MM-DD

      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching reservations:', error);
      return [];
    }
  },

  async createReservation(data: NewReservationData): Promise<Reservation | null> {
    try {
      const response = await axios.post(`${API_BASE_URL}/reservations`, data);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 409) {
        alert('予約が重複しています。時間を確認してください。');
      } else {
        console.error('Error creating reservation:', error);
        alert('予約の作成に失敗しました。');
      }
      return null;
    }
  },

  async deleteReservation(reservationId: string): Promise<boolean> {
    try {
      await axios.delete(`${API_BASE_URL}/reservations/${reservationId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting reservation ${reservationId}:`, error);
      return false;
    }
  }
};
