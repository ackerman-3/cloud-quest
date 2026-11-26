// 자동 생성 파일: scripts/office-room.py 를 고친 뒤 python3 scripts/office-room.py 로 다시 만드세요.
// 방 크기와 투영 원점, 가구 그림별 크기(w,h)와 기준점(ax,ay: 바닥 중심이 그림에서 놓이는 위치)
export const ROOM = {"W": 296, "H": 210, "OX": 160, "OY": 62, "RX": 64, "RY": 76, "SHELF_H": 20}
export const SPRITES: Record<string, { w: number; h: number; ax: number; ay: number; front: number }> = {
 "desk_fixed": {
  "w": 89,
  "h": 58,
  "ax": 44,
  "ay": 37,
  "front": 20
 },
 "lamp_basic": {
  "w": 10,
  "h": 15,
  "ax": 5,
  "ay": 15,
  "front": 0
 },
 "lamp_brass": {
  "w": 12,
  "h": 17,
  "ax": 4,
  "ay": 17,
  "front": 0
 },
 "lamp_mint": {
  "w": 10,
  "h": 13,
  "ax": 5,
  "ay": 13,
  "front": 0
 },
 "coffee_basic": {
  "w": 57,
  "h": 49,
  "ax": 28,
  "ay": 34,
  "front": 9
 },
 "coffee_capsule": {
  "w": 57,
  "h": 47,
  "ax": 28,
  "ay": 32,
  "front": 9
 },
 "coffee_espresso": {
  "w": 57,
  "h": 48,
  "ax": 28,
  "ay": 33,
  "front": 9
 },
 "coffee_tea": {
  "w": 57,
  "h": 43,
  "ax": 28,
  "ay": 28,
  "front": 9
 },
 "rug_navy": {
  "w": 105,
  "h": 53,
  "ax": 52,
  "ay": 26,
  "front": -999
 },
 "rug_mint": {
  "w": 105,
  "h": 53,
  "ax": 52,
  "ay": 26,
  "front": -999
 },
 "rug_check": {
  "w": 105,
  "h": 53,
  "ax": 52,
  "ay": 26,
  "front": -999
 },
 "shelf_basic": {
  "w": 65,
  "h": 53,
  "ax": 32,
  "ay": 36,
  "front": 16.0
 },
 "shelf_wood": {
  "w": 65,
  "h": 53,
  "ax": 32,
  "ay": 36,
  "front": 16.0
 },
 "shelf_glass": {
  "w": 65,
  "h": 53,
  "ax": 32,
  "ay": 36,
  "front": 16.0
 },
 "whiteboard": {
  "w": 47,
  "h": 49,
  "ax": 24,
  "ay": 38,
  "front": 0
 },
 "beanbag": {
  "w": 27,
  "h": 19,
  "ax": 13,
  "ay": 13,
  "front": 0
 },
 "arcade": {
  "w": 39,
  "h": 47,
  "ax": 22,
  "ay": 38,
  "front": 4
 },
 "plant_basic": {
  "w": 25,
  "h": 27,
  "ax": 12,
  "ay": 20,
  "front": 3
 },
 "monstera": {
  "w": 25,
  "h": 35,
  "ax": 12,
  "ay": 28,
  "front": 3
 },
 "olive": {
  "w": 25,
  "h": 38,
  "ax": 12,
  "ay": 31,
  "front": 3
 },
 "palm": {
  "w": 25,
  "h": 40,
  "ax": 12,
  "ay": 33,
  "front": 3
 }
}
