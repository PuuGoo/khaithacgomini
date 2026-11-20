const PARKING_LABELS = {
  land: 'Bãi xe',
  yacht: 'Bến du thuyền',
  plane: 'Đường băng',
  heli: 'Bãi đáp trực thăng'
};

const DIRECTIONS = ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'];

export function parkingStatus(home, position, speed) {
  const dx = home.x - position.x;
  const dz = (home.parkZ ?? home.z) - position.z;
  const distance = Math.hypot(dx, dz);
  const label = home.name ? PARKING_LABELS[home.mode] + ' · ' + home.name : PARKING_LABELS[home.mode];
  const radius = home.mode === 'plane' ? 6 : home.mode === 'yacht' ? 4 : 4.5;
  if (distance > radius) {
    const direction = DIRECTIONS[(Math.round(Math.atan2(dx, -dz) / (Math.PI / 4)) + 8) % 8];
    return { ready: false, label: label + ' · ' + Math.ceil(distance) + ' m về hướng ' + direction };
  }
  if ((home.mode === 'plane' || home.mode === 'heli') && position.y > 0.65) {
    return { ready: false, label: 'Hạ độ cao bằng Shift hoặc nút Xuống' };
  }
  if (speed > 2) return { ready: false, label: 'Giảm tốc để đỗ tại ' + label };
  return { ready: true, label: 'Rời phương tiện tại ' + label };
}
