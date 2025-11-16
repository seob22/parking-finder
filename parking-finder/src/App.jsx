// @ts-nocheck
import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

// Leaflet 아이콘 설정
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

function App() {
    const [parkingData, setParkingData] = useState(null)
    const [photo, setPhoto] = useState(null)
    const [memo, setMemo] = useState('')
    const [floor, setFloor] = useState('')
    const [zone, setZone] = useState('')
    const [showCamera, setShowCamera] = useState(false)
    const [loading, setLoading] = useState(false)
    const [notificationPermission, setNotificationPermission] = useState(null)
    const [reminderTime, setReminderTime] = useState('') // 알림 시간 (분 단위)

    // 알림 권한 확인
    useEffect(() => {
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission)
        }
    }, [])

    // 알림 권한 요청
    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission()
            setNotificationPermission(permission)
            if (permission === 'granted') {
                alert('알림 권한이 허용되었습니다! 🔔')
            }
        } else {
            alert('이 브라우저는 알림을 지원하지 않습니다.')
        }
    }

    // 푸시 알림 전송
    const sendNotification = (title, body) => {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: '🚗',
                badge: '🚗',
                vibrate: [200, 100, 200],
            })
        }
    }

    // 알림 스케줄링
    const scheduleNotification = (minutes) => {
        const milliseconds = minutes * 60 * 1000
        setTimeout(() => {
            sendNotification(
                '🚗 주차 위치 알림',
                `${minutes}분 전에 주차하셨습니다. 차량 위치를 확인하세요!`
            )
        }, milliseconds)
    }

    const handlePhotoCapture = (e) => {
        const file = e.target.files && e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                const img = new Image()
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const maxWidth = 800
                    const maxHeight = 800
                    let width = img.width
                    let height = img.height

                    if (width > height) {
                        if (width > maxWidth) {
                            height = height * (maxWidth / width)
                            width = maxWidth
                        }
                    } else {
                        if (height > maxHeight) {
                            width = width * (maxHeight / height)
                            height = maxHeight
                        }
                    }

                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')
                    ctx.drawImage(img, 0, 0, width, height)

                    const compressedImage = canvas.toDataURL('image/jpeg', 0.7)
                    setPhoto(compressedImage)
                }
                img.src = reader.result
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSaveParking = () => {
        setLoading(true)

        // 실제 GPS 위치 가져오기
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const data = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        photo: photo,
                        memo: memo,
                        floor: floor,
                        zone: zone,
                        timestamp: new Date().toISOString(),
                        reminderTime: reminderTime
                    }

                    localStorage.setItem('parkingData', JSON.stringify(data))
                    setParkingData(data)
                    setPhoto(null)
                    setMemo('')
                    setFloor('')
                    setZone('')
                    setReminderTime('')
                    setShowCamera(false)
                    setLoading(false)

                    // 즉시 알림
                    sendNotification('✅ 주차 위치 저장 완료!', '주차 위치가 성공적으로 저장되었습니다.')

                    // 알림 스케줄링
                    if (reminderTime && parseInt(reminderTime) > 0) {
                        scheduleNotification(parseInt(reminderTime))
                        alert(`${reminderTime}분 후에 알림을 보내드릴게요! 🔔`)
                    } else {
                        alert('주차 위치가 저장되었습니다! 🚗')
                    }
                },
                (error) => {
                    setLoading(false)
                    let errorMsg = '위치를 가져올 수 없습니다.'

                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMsg = '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.'
                            break
                        case error.POSITION_UNAVAILABLE:
                            errorMsg = '위치 정보를 사용할 수 없습니다.'
                            break
                        case error.TIMEOUT:
                            errorMsg = '위치 요청 시간이 초과되었습니다.'
                            break
                    }

                    alert('오류: ' + errorMsg)
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            )
        } else {
            setLoading(false)
            alert('이 브라우저는 위치 서비스를 지원하지 않습니다.')
        }
    }

    const handleDeleteParking = () => {
        if (window.confirm('저장된 주차 위치를 삭제하시겠습니까?')) {
            localStorage.removeItem('parkingData')
            setParkingData(null)
            sendNotification('🗑️ 주차 위치 삭제됨', '저장된 주차 위치가 삭제되었습니다.')
            alert('삭제되었습니다.')
        }
    }

    useEffect(() => {
        const saved = localStorage.getItem('parkingData')
        if (saved) {
            setParkingData(JSON.parse(saved))
        }
    }, [])

    return (
        <div className="app">
            <header className="header">
                <div className="header-icon">🚗</div>
                <h1>주차 위치 찾기</h1>
                <p className="header-subtitle">내 차는 어디에?</p>

                {/* 알림 권한 버튼 */}
                {notificationPermission !== 'granted' && (
                    <button
                        onClick={requestNotificationPermission}
                        className="notification-permission-btn"
                    >
                        🔔 알림 권한 허용하기
                    </button>
                )}
                {notificationPermission === 'granted' && (
                    <div className="notification-status">
                        ✅ 알림 활성화됨
                    </div>
                )}
            </header>

            <main className="main">
                {parkingData ? (
                    <div className="parking-info">
                        <div className="info-header">
                            <h2>💖 저장된 주차 위치</h2>
                            <div className="elapsed-time">
                                {formatDistanceToNow(new Date(parkingData.timestamp), {
                                    addSuffix: true,
                                    locale: ko
                                })} 주차
                            </div>
                        </div>

                        {/* 지도 표시 */}
                        <div className="map-wrapper">
                            <MapContainer
                                center={[parkingData.lat, parkingData.lng]}
                                zoom={17}
                                style={{ height: '300px', width: '100%', borderRadius: '20px' }}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; OpenStreetMap contributors'
                                />
                                <Marker position={[parkingData.lat, parkingData.lng]}>
                                    <Popup>
                                        <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                            🚗 내 차 위치
                                        </div>
                                    </Popup>
                                </Marker>
                            </MapContainer>
                        </div>

                        {/* GPS 좌표 표시 */}
                        <div className="gps-coords">
                            <span className="coords-icon">📍</span>
                            <span className="coords-text">
                                위도: {parkingData.lat.toFixed(6)}, 경도: {parkingData.lng.toFixed(6)}
                            </span>
                        </div>

                        {/* 층수/구역 정보 */}
                        {(parkingData.floor || parkingData.zone) && (
                            <div className="location-tags">
                                {parkingData.floor && (
                                    <div className="location-tag floor-tag">
                                        <span className="tag-icon">🏢</span>
                                        <span className="tag-text">{parkingData.floor}</span>
                                    </div>
                                )}
                                {parkingData.zone && (
                                    <div className="location-tag zone-tag">
                                        <span className="tag-icon">📍</span>
                                        <span className="tag-text">{parkingData.zone}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {parkingData.photo && (
                            <div className="photo-frame">
                                <img
                                    src={parkingData.photo}
                                    alt="주차 위치"
                                    className="parking-photo"
                                />
                            </div>
                        )}

                        {parkingData.memo && (
                            <div className="memo-display">
                                <span className="memo-icon">📝</span>
                                <span className="memo-text">{parkingData.memo}</span>
                            </div>
                        )}

                        {/* 알림 설정 정보 */}
                        {parkingData.reminderTime && (
                            <div className="reminder-info">
                                🔔 {parkingData.reminderTime}분 후 알림 예정
                            </div>
                        )}

                        <div className="button-group">

                            <a href={'https://www.google.com/maps/dir/?api=1&destination=' + parkingData.lat + ',' + parkingData.lng}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="button button-primary"
                            >
                                <span className="button-icon">🧭</span>
                                <span>길찾기</span>
                            </a>
                            <button
                                onClick={handleDeleteParking}
                                className="button button-danger"
                            >
                                <span className="button-icon">🗑️</span>
                                <span>삭제</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="save-parking">
                        <div className="welcome-icon">🅿️</div>
                        <h2>새 주차 위치 저장</h2>

                        {!showCamera ? (
                            <button
                                onClick={() => setShowCamera(true)}
                                className="button button-primary button-large"
                            >
                                <span className="button-icon">📸</span>
                                <span>주차 위치 저장하기</span>
                            </button>
                        ) : (
                            <div className="camera-section">
                                <div className="photo-input">
                                    <label htmlFor="photo" className="photo-label">
                                        {photo ? (
                                            <img src={photo} alt="촬영된 사진" className="preview" />
                                        ) : (
                                            <div className="photo-placeholder">
                                                <div className="placeholder-icon">📷</div>
                                                <div className="placeholder-text">사진 촬영 또는 선택</div>
                                            </div>
                                        )}
                                    </label>
                                    <input
                                        id="photo"
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handlePhotoCapture}
                                        style={{ display: 'none' }}
                                    />
                                </div>

                                {/* 층수/구역 입력 */}
                                <div className="input-row">
                                    <div className="input-field">
                                        <label className="input-label">
                                            <span className="label-icon">🏢</span>
                                            <span>층수</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="예: 지하 2층, B2"
                                            value={floor}
                                            onChange={(e) => setFloor(e.target.value)}
                                            className="text-input"
                                        />
                                    </div>
                                    <div className="input-field">
                                        <label className="input-label">
                                            <span className="label-icon">📍</span>
                                            <span>구역</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="예: A구역, C-12"
                                            value={zone}
                                            onChange={(e) => setZone(e.target.value)}
                                            className="text-input"
                                        />
                                    </div>
                                </div>

                                {/* 알림 시간 설정 */}
                                <div className="input-field">
                                    <label className="input-label">
                                        <span className="label-icon">⏰</span>
                                        <span>알림 시간 (선택사항)</span>
                                    </label>
                                    <select
                                        value={reminderTime}
                                        onChange={(e) => setReminderTime(e.target.value)}
                                        className="text-input"
                                    >
                                        <option value="">알림 없음</option>
                                        <option value="30">30분 후</option>
                                        <option value="60">1시간 후</option>
                                        <option value="120">2시간 후</option>
                                        <option value="180">3시간 후</option>
                                        <option value="240">4시간 후</option>
                                    </select>
                                </div>

                                <div className="input-field">
                                    <label className="input-label">
                                        <span className="label-icon">📝</span>
                                        <span>메모</span>
                                    </label>
                                    <textarea
                                        placeholder="예: 엘리베이터 근처, 기둥 옆"
                                        value={memo}
                                        onChange={(e) => setMemo(e.target.value)}
                                        className="memo-input"
                                        rows={3}
                                    />
                                </div>

                                <div className="button-group">
                                    <button
                                        onClick={handleSaveParking}
                                        disabled={loading}
                                        className="button button-primary"
                                    >
                                        <span className="button-icon">{loading ? '⏳' : '💾'}</span>
                                        <span>{loading ? '저장 중...' : '저장'}</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowCamera(false)
                                            setPhoto(null)
                                            setMemo('')
                                            setFloor('')
                                            setZone('')
                                            setReminderTime('')
                                        }}
                                        className="button button-secondary"
                                    >
                                        <span className="button-icon">❌</span>
                                        <span>취소</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )
                }
            </main >
        </div >
    )
}

export default App