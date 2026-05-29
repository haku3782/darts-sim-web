import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [apiMessage, setApiMessage] = useState<string>('読み込み中...')

  useEffect(() => {
    // バックエンドのAPIへリクエストを送る
    fetch('https://darts-sim-api.onrender.com/api/hello')
      .then((response) => {
        if (!response.ok) {
          throw new Error('ネットワークエラー')
        }
        return response.json()
      })
      .then((data) => {
        // 取得したJSONデータ（{"message": "..."}）を状態にセットする
        setApiMessage(data.message)
      })
      .catch((error) => {
        console.error('Fetch error:', error)
        setApiMessage('APIの取得に失敗しました。サーバーが起動しているか確認してください。')
      })
  }, [])

  return (
    <div className="App">
      <h1>ダーツ物理シミュレーター</h1>
      <div className="card">
        <h2>バックエンドからのメッセージ：</h2>
        {/* ここにAPIから取得した文字が表示されます */}
        <p style={{ color: '#646cff', fontWeight: 'bold' }}>{apiMessage}</p>
      </div>
    </div>
  )
}

export default App