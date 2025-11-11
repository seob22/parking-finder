import localforage from 'localforage';

// 로컬 스토리지 초기화
localforage.config({
    name: 'ParkingFinder',
    storeName: 'parkingData'
});

// 주차 위치 저장
export const saveParkingLocation = async (locationData) => {
    try {
        await localforage.setItem('currentParking', {
            ...locationData,
            timestamp: new Date().toISOString()
        });
        return true;
    } catch (error) {
        console.error('저장 실패:', error);
        return false;
    }
};

// 주차 위치 가져오기
export const getParkingLocation = async () => {
    try {
        return await localforage.getItem('currentParking');
    } catch (error) {
        console.error('불러오기 실패:', error);
        return null;
    }
};

// 주차 위치 삭제
export const deleteParkingLocation = async () => {
    try {
        await localforage.removeItem('currentParking');
        return true;
    } catch (error) {
        console.error('삭제 실패:', error);
        return false;
    }
};

// 주차 히스토리 저장
export const saveParkingHistory = async (locationData) => {
    try {
        const history = await localforage.getItem('parkingHistory') || [];
        history.unshift({
            ...locationData,
            timestamp: new Date().toISOString()
        });
        // 최근 10개만 유지
        await localforage.setItem('parkingHistory', history.slice(0, 10));
        return true;
    } catch (error) {
        console.error('히스토리 저장 실패:', error);
        return false;
    }
};

// 주차 히스토리 가져오기
export const getParkingHistory = async () => {
    try {
        return await localforage.getItem('parkingHistory') || [];
    } catch (error) {
        console.error('히스토리 불러오기 실패:', error);
        return [];
    }
};