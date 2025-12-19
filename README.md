# project
기초웹개발론 프로젝트
# 2. 리스크 및 해결 과정
1. 오디오 재생 불가.
* 발생 상황
- 오디오 재생이 안 됨.

> 1차 시도.
>> Manifest V3의 백그라운드(Service Worker)는 DOM 객체가 없어 <audio> 태그나 <iframe>을 직접 생성할 수 없음.
>> Offscreen 문서 하나에 모든 로직을 때려 박았으나 스크립트 로딩 순서와 유튜브 API 초기화 시점의 충돌로 인해 재생 실패가 발생.
>> 설계 변경: Offscreen.js(단순 중계)와 Player.js(실제 재생)를 물리적으로 분리.
>> Sandbox 적용: player.html을 manifest.json의 sandbox 영역에 격리하여, 외부 스크립트(YouTube API)가 안전하고 독립적인 환경에서 초기화되도록 보장.

> 결과: 실패.
>> 여전히 오디오 재생이 안 됨.
