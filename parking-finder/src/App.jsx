// @ts-nocheck
import { useState, useEffect } from 'react'
import 'leaflet/dist/leaflet.css'
import './App.css'

function App() {
    const [parkingData, setParkingData] = useState(null)
    const [photo, setPhoto] = useState(null)
    const [memo, setMemo] = useState('')
    const [showCamera, setShowCamera] = useState(false)
    const handlePhotoCapture = (e) => {
        const file = e.target.files && e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                // 이미지 압축
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

                    // 압축된 이미지를 base64로 변환 (품질 0.7)
                    const compressedImage = canvas.toDataURL('image/jpeg', 0.7)
                    setPhoto(compressedImage)
                }
                img.src = reader.result
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSaveParking = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                const data = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    photo: photo,
                    memo: memo,
                    timestamp: new Date().toISOString()
                }

                localStorage.setItem('parkingData', JSON.stringify(data))
                setParkingData(data)
                setPhoto(null)
                setMemo('')
                setShowCamera(false)
                alert('주차 위치가 저장되었습니다! 🚗')
            })
        }
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
                <h1>🚗 주차 위치 찾기</h1>
            </header>

            <main className="main">
                {parkingData ? (
                    <div className="parking-info">
                        <h2>저장된 주차 위치</h2>

                        {parkingData.photo && (
                            <img
                                src={parkingData.photo}
                                alt="주차 위치"
                                className="parking-photo"
                            />
                        )}

                        {parkingData.memo && (
                            <p className="memo">📝 {parkingData.memo}</p>
                        )}

                        <p className="timestamp">
                            ⏰ {new Date(parkingData.timestamp).toLocaleString('ko-KR')}
                        </p>

                        <div className="button-group">

                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${parkingData.lat},${parkingData.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="button button-primary"
                            >
                                🧭 길찾기
                            </a>
                            <button
                                onClick={handleDeleteParking}
                                className="button button-danger"
                            >
                                🗑️ 삭제
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="save-parking">
                        <h2>새 주차 위치 저장</h2>

                        {!showCamera ? (
                            <button
                                onClick={() => setShowCamera(true)}
                                className="button button-primary button-large"
                            >
                                📸 주차 위치 저장하기
                            </button>
                        ) : (
                            <div className="camera-section">
                                <div className="photo-input">
                                    <label htmlFor="photo" className="photo-label">
                                        {photo ? (
                                            <img src={photo} alt="촬영된 사진" className="preview" />
                                        ) : (
                                            <div className="photo-placeholder">
                                                📷 사진 촬영 또는 선택
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

                                <textarea
                                    placeholder="메모 (선택사항)"
                                    value={memo}
                                    onChange={(e) => setMemo(e.target.value)}
                                    className="memo-input"
                                    rows={3}
                                />

                                <div className="button-group">
                                    <button
                                        onClick={handleSaveParking}
                                        className="button button-primary"
                                    >
                                        💾 저장
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowCamera(false)
                                            setPhoto(null)
                                            setMemo('')
                                        }}
                                        className="button button-secondary"
                                    >
                                        취소
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