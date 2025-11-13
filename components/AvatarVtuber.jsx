// /components/AvatarVtuber.jsx
import React, { useRef, useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';

import { Live2DModel } from 'pixi-live2d-display/lib/cubism4.js';

export default function AvatarVtuber({ emotion, lipSync }) {
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);

  useEffect(() => {
    // ✅ ĐẶT Ở ĐÂY:
    window.PIXI = PIXI; 
    
    if (!canvasRef.current) return;

    const modelPath = '/pachan2.0/pachirisuanimegirl-tophalf.model3.json';

    const app = new PIXI.Application({
      view: canvasRef.current,
      width: 500,
      height: 500,
      transparent: true,
      autoStart: true,
    });

    async function loadModel() {
      try {
        const live2DModel = await Live2DModel.from(modelPath);
        app.stage.addChild(live2DModel);
        
        live2DModel.scale.set(0.25);
        live2DModel.anchor.set(0.5, 0.5);
        live2DModel.position.set(app.view.width / 2, app.view.height / 1.5);

        setModel(live2DModel);
      } catch (error) {
        console.error("Lỗi khi tải model Live2D:", error);
      }
    }

    loadModel();

    return () => {
      app.destroy(true, true);
    };
  }, []); // Chỉ chạy 1 lần khi mount

  // ... (Các useEffect khác giữ nguyên) ...
  useEffect(() => {
    if (model && emotion) {
      const expressionMap = {
        'happy': 'F01',
        'sad': 'F02',
        'angry': 'F03',
        'neutral': 'F00',
      };
      const expressionName = expressionMap[emotion] || expressionMap['neutral'];
      if (expressionName) {
        model.expression(expressionName);
      }
    }
  }, [model, emotion]);

  useEffect(() => {
    if (model && lipSync) {
      const mouthOpen = (lipSync.a + lipSync.i + lipSync.u + lipSync.e + lipSync.o) / 5;
      model.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', mouthOpen * 1.5);
    }
  }, [model, lipSync]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    />
  );
}