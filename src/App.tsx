import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

// --- 型定義 ---
type GameRule = "SOFT" | "HARD";

interface TrajectoryPoint {
  time: number;
  x: number;
  y: number;
  z: number;
}

interface SimulationRecord {
  id: number;
  initialVelocity: number;
  angle: number;
  drag: number;
  createdAt: string;
}

export default function App() {
  // --- State管理（初期値） ---
  const [gameRule, setGameRule] = useState<GameRule>("SOFT");
  const [weight, setWeight] = useState(20.0);
  const [drag, setDrag] = useState(0.0005);
  const [speed, setSpeed] = useState(25.0); // 初心者〜中級者の平均的なダーツ初速(20〜30km/h)に設定
  const [angle, setAngle] = useState(10.0);
  const [releaseHeight, setReleaseHeight] = useState(1.65);
  const [releaseDistance, setReleaseDistance] = useState(2.1);

  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 履歴データを保存するためのState
  const [history, setHistory] = useState<SimulationRecord[]>([]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(
        "https://darts-sim-api.onrender.com/api/history",
      );
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error("履歴の取得に失敗しました", error);
    }
  };

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch(
          "https://darts-sim-api.onrender.com/api/history",
        );
        if (response.ok) {
          const data = await response.json();
          setHistory(data);
        }
      } catch (error) {
        console.error("履歴の取得に失敗しました", error);
      }
    };
    loadHistory();
  }, []);

  // --- API呼び出し関数 ---
  const runSimulation = async () => {
    setIsLoading(true);
    try {
      const apiUrl = "https://darts-sim-api.onrender.com/api/simulate";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameRule,
          dartSetting: {
            weight,
            centerOfGravity: 0.5, // 今回は固定
            dragCoefficient: drag,
          },
          throwCondition: {
            speed,
            angle,
            releaseHeight,
            releaseDistance,
          },
        }),
      });

      const data = await response.json();
      setTrajectory(data.trajectory);

      // シミュレーションが終わったら、最新の履歴を再取得して表を更新する
      fetchHistory();
    } catch (error) {
      console.error("シミュレーションに失敗しました:", error);
      alert(
        "API通信エラーが発生しました。URLやサーバーの状態を確認してください。",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // --- 描画 ---
  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "sans-serif",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <h1>🎯 ダーツ物理シミュレーター (MVP)</h1>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {/* 左側：入力フォーム */}
        <div
          style={{
            flex: "1",
            minWidth: "300px",
            padding: "20px",
            background: "#f5f5f5",
            borderRadius: "8px",
          }}
        >
          <h3>セッティング & スロー条件</h3>

          <label>
            ルール:
            <select
              value={gameRule}
              onChange={(e) => setGameRule(e.target.value as GameRule)}
              style={{ marginLeft: "10px" }}
            >
              <option value="SOFT">ソフト (的まで遠い)</option>
              <option value="HARD">ハード (的まで近い)</option>
            </select>
          </label>
          <hr />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            <label>
              バレル重量 (g):{" "}
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
              />
            </label>
            <label>
              空気抵抗:{" "}
              <input
                type="number"
                step="0.01"
                value={drag}
                onChange={(e) => setDrag(Number(e.target.value))}
              />
            </label>
            <label>
              初速 (km/h):{" "}
              <input
                type="number"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              />
            </label>
            <label>
              射出角度 (度):{" "}
              <input
                type="number"
                step="0.1"
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
              />
            </label>
            <label>
              リリース高さ (m):{" "}
              <input
                type="number"
                step="0.01"
                value={releaseHeight}
                onChange={(e) => setReleaseHeight(Number(e.target.value))}
              />
            </label>
            <label>
              リリース距離 (m):{" "}
              <input
                type="number"
                step="0.01"
                value={releaseDistance}
                onChange={(e) => setReleaseDistance(Number(e.target.value))}
              />
            </label>
          </div>

          <button
            onClick={runSimulation}
            disabled={isLoading}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              fontSize: "16px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              width: "100%",
            }}
          >
            {isLoading ? "計算中..." : "軌道を計算する 🚀"}
          </button>
        </div>

        {/* 右側：グラフ描画エリア */}
        <div
          style={{
            flex: "2",
            minWidth: "500px",
            height: "400px",
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        >
          <h3>軌道グラフ (横からの視点)</h3>
          {trajectory.length === 0 ? (
            <p
              style={{ textAlign: "center", marginTop: "150px", color: "#666" }}
            >
              左のボタンを押してシミュレーションを開始してください
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart
                data={trajectory}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                {/* X軸: 距離 */}
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={[0, releaseDistance + 0.2]}
                  label={{
                    value: "距離 (m)",
                    position: "insideBottom",
                    offset: -10,
                  }}
                />
                {/* Y軸: 高さ (床から少し上～的の少し上までを表示) */}
                <YAxis
                  dataKey="y"
                  type="number"
                  domain={[1.0, 2.5]}
                  label={{
                    value: "高さ (m)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip
                  formatter={(value) =>
                    `${Number(value as number).toFixed(3)} m`
                  }
                  labelFormatter={(label) =>
                    `距離: ${Number(label as number).toFixed(2)} m`
                  }
                />

                {/* 放物線 */}
                <Line
                  type="monotone"
                  dataKey="y"
                  stroke="#8884d8"
                  strokeWidth={3}
                  dot={false}
                />

                {/* 補助線：的までの距離と、ブルの高さ(1.73m) */}
                <ReferenceLine
                  x={releaseDistance}
                  stroke="red"
                  strokeDasharray="3 3"
                  label="ボード位置"
                />
                <ReferenceLine
                  y={1.73}
                  stroke="green"
                  strokeDasharray="3 3"
                  label="ブル (1.73m)"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ==========================================
          ▼ 追記: 履歴表示エリア
          ========================================== */}
      <div style={{ marginTop: "40px" }}>
        <h3>📊 過去のシミュレーション履歴</h3>
        <table
          border={1}
          style={{
            width: "100%",
            textAlign: "center",
            borderCollapse: "collapse",
            backgroundColor: "#fff",
          }}
        >
          <thead style={{ backgroundColor: "#f0f0f0" }}>
            <tr>
              <th style={{ padding: "8px" }}>ID</th>
              <th style={{ padding: "8px" }}>初速 (km/h)</th>
              <th style={{ padding: "8px" }}>角度 (度)</th>
              <th style={{ padding: "8px" }}>空気抵抗</th>
              <th style={{ padding: "8px" }}>実行日時</th>
            </tr>
          </thead>
          <tbody>
            {history.map((record) => (
              <tr key={record.id}>
                <td style={{ padding: "8px" }}>{record.id}</td>
                {/* バックエンドから返ってくるJSONのキー名に合わせます */}
                <td style={{ padding: "8px" }}>{record.initialVelocity}</td>
                <td style={{ padding: "8px" }}>{record.angle}</td>
                <td style={{ padding: "8px" }}>{record.drag}</td>
                <td style={{ padding: "8px" }}>
                  {new Date(record.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
