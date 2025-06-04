import { mount, shallowMount } from '@vue/test-utils';
import RoomList from '@/components/RoomList.vue';
import apiService from '@/services/apiService';
import type { Room } from '@/types';

// apiService.getRooms をモック化
jest.mock('@/services/apiService', () => ({
  getRooms: jest.fn(),
}));

const mockRooms: Room[] = [
  { id: 'r1', name: 'Room Alpha', capacity: 5, equipment: ['Projector'] },
  { id: 'r2', name: 'Room Beta', capacity: 10, equipment: [] },
];

describe('RoomList.vue', () => {
  beforeEach(() => {
    // 各テストの前にモックをリセット
    (apiService.getRooms as jest.Mock).mockReset();
  });

  it('renders loading state initially', () => {
    (apiService.getRooms as jest.Mock).mockReturnValue(new Promise(() => {})); // 解決しないPromiseでローディング維持
    const wrapper = shallowMount(RoomList);
    expect(wrapper.find('.loading').exists()).toBe(true);
  });

  it('renders rooms after successful fetch', async () => {
    (apiService.getRooms as jest.Mock).mockResolvedValue(mockRooms);
    const wrapper = shallowMount(RoomList);

    // DOMの更新を待つ
    await wrapper.vm.$nextTick(); // onMounted 内の非同期処理
    await wrapper.vm.$nextTick(); // loading = false と rooms.value = ... の反映

    expect(wrapper.find('.loading').exists()).toBe(false);
    const roomItems = wrapper.findAll('.room-item');
    expect(roomItems.length).toBe(mockRooms.length);
    expect(roomItems[0].find('h3').text()).toBe(mockRooms[0].name);
    expect(roomItems[1].find('h3').text()).toBe(mockRooms[1].name);
  });

  it('renders error message on fetch failure', async () => {
    (apiService.getRooms as jest.Mock).mockRejectedValue(new Error('Fetch error'));
    const wrapper = shallowMount(RoomList);

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.error-message').exists()).toBe(true);
    expect(wrapper.find('.error-message').text()).toContain('会議室の読み込みに失敗しました。');
  });

  it('emits selectRoom event when a room button is clicked', async () => {
    (apiService.getRooms as jest.Mock).mockResolvedValue([mockRooms[0]]);
    const wrapper = shallowMount(RoomList);

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    await wrapper.find('.room-item button').trigger('click');
    expect(wrapper.emitted().selectRoom).toBeTruthy();
    expect(wrapper.emitted().selectRoom[0]).toEqual([mockRooms[0]]);
  });
});