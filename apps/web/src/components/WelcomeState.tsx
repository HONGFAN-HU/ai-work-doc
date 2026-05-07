import { Button } from 'tdesign-react';

interface WelcomeStateProps {
  onCreate: () => void;
}

export function WelcomeState({ onCreate }: WelcomeStateProps) {
  return (
    <div className="welcome-state">
      <div className="welcome-content">
        <img
          className="welcome-icon"
          src="/img.png"
          alt="Docen"
        />
        <div className="welcome-text">
          <h2 className="welcome-title">欢迎使用Docen</h2>
          <p className="welcome-subtitle">专属于 AI 的笔记本</p>
        </div>
        <Button theme="primary" onClick={onCreate}>
          创建新页面
        </Button>
      </div>
    </div>
  );
}
