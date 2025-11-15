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
        const data = {
            lat: 37.5665,
            lng: 126.9780,
            photo: photo,
            memo: memo,
            floor: floor,
            zone: zone,
            timestamp: new Date().toISOString()
        }

        localStorage.setItem('parkingData', JSON.stringify(data))
        setParkingData(data)
        setPhoto(null)
        setMemo('')
        setFloor('')
        setZone('')
        setShowCamera(false)
        alert('주차 위치가 저장되었습니다! 🚗')
    }

    const handleDeleteParking = () => {
        if (window.confirm('저장된 주차 위치를 삭제하시겠습니까?')) {
            localStorage.removeItem('parkingData')
            setParkingData(null)
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
            </header>

            <main className="main">
                {parkingData ? (
                    <div className="parking-info">
                        <div className="info-header">
                            <h2>💖 저장된 주차 위치</h2>
                            <div className="elapsed-time">
                                ⏰ {formatDistanceToNow(new Date(parkingData.timestamp), {
                                    addSuffix: true,
                                    locale: ko
                                })} 주차
                            </div>
                        </div>

                        {/* 지도 표시 */}
                        <div className="map-wrapper">
                            <MapContainer
                                center={[parkingData.lat, parkingData.lng]}
                                zoom={16}
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
                                        className="button button-primary"
                                    >
                                        <span className="button-icon">💾</span>
                                        <span>저장</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowCamera(false)
                                            setPhoto(null)
                                            setMemo('')
                                            setFloor('')
                                            setZone('')
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