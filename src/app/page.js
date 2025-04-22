'use client';
 
import { useState } from "react";
import Image from "next/image";
 
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
 
export default function Home() {
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
 
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
 
  return (
    <div className="container max-w-2xl mx-auto p-5">
      
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
        <>{prediction.output}
          {(prediction.output && prediction.status === "succeeded") && (
            <div className="image-wrapper mt-5">
              <div 
                className="svg-container"
                dangerouslySetInnerHTML={{ __html: prediction.output.join('') }}
              />
            </div>
          )}
          <p className="py-3 text-sm opacity-50">状态: {prediction.status === 'succeeded' ? '分析完成' : '正在分析请稍候……'}</p>
        </>
      )}
    </div>
  );
} 
