import { useCallback, useEffect, useRef, useState} from "react";
import Webcam from "react-webcam";
import { css } from "@emotion/css";
import { Camera } from "@mediapipe/camera_utils";
import { Hands, Results } from "@mediapipe/hands";
import { drawCanvas } from "./utils/drawCanvas";

const App = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultsRef = useRef<Results>();
  const [landmarkResults, setLandmarkResults] = useState('');
  const [noHandFrame, setNoHandFrame] = useState(0);

  /**
   * 검출결과（프레임마다 호출됨）
   * @param results
   */
  const onResults = useCallback((results: Results) => {
    resultsRef.current = results;

    const canvasCtx = canvasRef.current!.getContext("2d")!;
    drawCanvas(canvasCtx, results);
    // if(results !== undefined && results !== null){
    const responseObject = results.multiHandLandmarks;

    if(responseObject.length>0){
      const obj = responseObject[0];
      setNoHandFrame(0);
      if(getDistanceBetweenTwoPoints(obj[8],obj[20]) < 0.19 && (getDistanceBetweenTwoPoints(obj[4],obj[12]) < 0.065 || getDistanceBetweenTwoPoints(obj[4],obj[8]) < 0.065|| getDistanceBetweenTwoPoints(obj[4],obj[16]) < 0.065) && obj[0].y <0.49){
        setLandmarkResults('❌ using phone')
      }else if(obj[0].y >=0.49 && getDistanceBetweenTwoPoints(obj[4],obj[12]) < 0.13 && getDistanceBetweenTwoPoints(obj[4],obj[8]) < 0.1 && getDistanceBetweenTwoPoints(obj[4],obj[20]) < 0.20){
        setLandmarkResults('✅ pen');
      }
      else if(obj[0].y >= 0.49  ){
        setLandmarkResults('✅ studying')
      }
      // setLandmarkResults(JSON.stringify(responseObject[0][0]).toString());
    }else{
      setNoHandFrame((prev) => prev + 1);
    }
      
    // }
  }, []);

  

  // 초기설정
  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults(onResults);

    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null
    ) {
      const camera = new Camera(webcamRef.current.video!, {
        onFrame: async () => {
          await hands.send({ image: webcamRef.current!.video! });
        },
        width: 500,
        height: 500,
      });
      camera.start();
    }
  }, [onResults]);

  /*  랜드마크들의 좌표를 콘솔에 출력 */
  const OutputData = () => {
    const results = resultsRef.current!;
    const responseObject = results.multiHandLandmarks[0][0];
    console.log(JSON.stringify(responseObject));
  };

  const getDistanceBetweenTwoPoints = (point1:any, point2:any) => {
    const x_diff = Math.abs(point1.x - point2.x)
    const y_diff = Math.abs(point1.y - point2.y)
    const z_diff = Math.abs(point1.z - point2.z)
    return Math.sqrt(x_diff*x_diff + y_diff*y_diff + z_diff*z_diff)
  }

  return (
    <div className={styles.container}>
      {/* 비디오 캡쳐 */}
      <Webcam
        audio={false}
        style={{ visibility: "hidden" }}
        width={500}
        height={500}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{ width: 500, height: 500, facingMode: "user" }}
      />
      {/* 랜드마크를 손에 표시 */}
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        width={500}
        height={500}
      />
      {/* 좌표 출력 */}
      {/* <div className={styles.buttonContainer}>
        <button className={styles.button} onClick={OutputData}>
          Output Data
        </button>
      </div> */}
      <p className={styles.pContainer}>{noHandFrame>=20 ? '❌ not here':landmarkResults}</p>
      {/* <p className={styles.frameCountContainer}>{noHandFrame}</p> */}

    </div>
  );
};

// ==============================================
// styles

const styles = {
  container: css`
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
  `,
  canvas: css`
    position: absolute;
    width: 500px;
    height: 500px;
    background-color: #fff;
  `,
  buttonContainer: css`
    position: absolute;
    top: 20px;
    left: 20px;
  `,
  pContainer: css`
    position: absolute;
    top: 40px;
    left: 10px;
  `,
  frameCountContainer: css`
    position: absolute;
    top: 50px;
    left: 10px;
  `,
  button: css`
    color: #fff;
    background-color: #0082cf;
    font-size: 1rem;
    border: none;
    border-radius: 5px;
    padding: 10px 10px;
    cursor: pointer;
  `,
};

export default App;
