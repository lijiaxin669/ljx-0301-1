class MockGameObject {
  setOrigin() { return this; }
  setPosition() { return this; }
  setDepth() { return this; }
  setText() { return this; }
  setActive() { return this; }
  setVisible() { return this; }
  setAngle() { return this; }
  destroy() { return this; }
  add() { return this; }
  alpha = 1;
  x = 0;
  y = 0;
}

class MockGraphics {
  fillStyle() { return this; }
  lineStyle() { return this; }
  fillRoundedRect() { return this; }
  strokeRoundedRect() { return this; }
  clear() { return this; }
}

class MockText extends MockGameObject {
  constructor() { super(); }
}

class MockContainer extends MockGameObject {
  constructor() { super(); }
}

class MockTweens {
  add() {}
}

class MockCamera {
  flash() {}
}

class MockCameras {
  main = new MockCamera();
}

class MockTime {
  now = 0;
  delayedCall() {}
}

class MockAdd {
  container() { return new MockContainer(); }
  graphics() { return new MockGraphics(); }
  text() { return new MockText(); }
}

class MockScene {
  time = new MockTime();
  add = new MockAdd();
  tweens = new MockTweens();
  cameras = new MockCameras();
}

namespace Phaser {
  export class Scene extends MockScene {}
  export namespace GameObjects {
    export class Container extends MockContainer {}
    export class Graphics extends MockGraphics {}
    export class Text extends MockText {}
  }
  export namespace Physics {
    export namespace Arcade {
      export class Sprite extends MockGameObject {}
    }
  }
}

export default Phaser;
