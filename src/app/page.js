'use client';
 
import { useState, useRef } from "react";
import Image from "next/image";
 
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
 
export default function Home() {
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const svgContainerRef = useRef(null);
 
  const handleSubmit = async (e) => {
    // 阻止原来的事件
    e.preventDefault();
    if(loading) return;
    setLoading(true);
    const response = await fetch("/api/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: e.target.prompt.value,
      }),
    });
    let prediction = await response.json();
    if (response.status !== 201) {
      setError(prediction.detail);
      setLoading(false);
      return;
    }
    setPrediction(prediction);
    
    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed"
    ) {
      await sleep(1000);
      const response = await fetch("/api/predictions/" + prediction.id);
      prediction = await response.json();
      if (response.status !== 200) {
        setError(prediction.detail);
        setLoading(false);
        return;
      }
      console.log({ prediction: prediction });
      setPrediction(prediction);
    }
    setLoading(false);
  };
  
  const downloadSvgAsImage = () => {
    if (!svgContainerRef.current) return;
    
    const svgElement = svgContainerRef.current.querySelector('svg');
    if (!svgElement) return;
    
    // 创建SVG数据URL
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    // 创建临时图像
    const img = new Image();
    img.onload = () => {
      // 创建Canvas并绘制图像
      const canvas = document.createElement('canvas');
      canvas.width = svgElement.clientWidth;
      canvas.height = svgElement.clientHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      // 转换为PNG并下载
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = '言外之意分析结果.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // 清理URL对象
      URL.revokeObjectURL(svgUrl);
    };
    
    img.src = svgUrl;
  };
 
  return (
    <div className="container max-w-2xl mx-auto p-5 min-h-screen flex flex-col">
      
      <h1 className="py-6 text-center font-bold text-2xl">言外之意</h1>
      <form className="w-full flex" onSubmit={handleSubmit}>
        <input
          type="text"
          className="flex-grow"
          name="prompt"
          placeholder="把对方的话粘进来，我来告诉你他（她）的潜台词"
        />
        <button className="button" type="submit">
          Go!
        </button>
      </form>
 
      {error && <div>{error}</div>}
 
      {prediction && (
        <>
          {(prediction.output && prediction.status === "succeeded") && (
            <div className="image-wrapper mt-5">
              <div 
                ref={svgContainerRef}
                className="svg-container"
                dangerouslySetInnerHTML={{ __html: prediction.output.join('') }}
              />
              <button 
                onClick={downloadSvgAsImage} 
                className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                下载为图片
              </button>
            </div>
          )}
          <p className="py-3 text-sm opacity-50">状态: {prediction.status === 'succeeded' ? '分析完成' : '正在分析请稍候……'}</p>
        </>
      )}
      <div className="mt-auto text-center py-2">
        <p className="text-[10px] text-gray-400">本应用仅供娱乐，分析结果不代表任何专业意见，请勿当真。</p>
      </div>
    </div>
  );
} 
