Blackboard — Professional Drawing & Whiteboard Application
<div align="center">

A modern high-performance whiteboard and drawing application built with React, Electron, and the HTML5 Canvas API.

Inspired by tools like Miro, FigJam, Excalidraw, and Linear.

⚡ Cross Platform • 🎨 Real-Time Drawing • 💻 Desktop + Web • 🚀 Optimized Rendering
</div>
✨ Features
🖊 Advanced Drawing Engine
Pen Tool
Pencil Tool
Marker Tool
Eraser Tool
Laser Tool
Line Tool
Rectangle Tool
Circle Tool
Text Tool
🎨 Professional Canvas Experience
Dual Canvas Rendering Architecture
Smooth pressure-sensitive strokes
perfect-freehand integration
Real-time rendering optimizations
Zoom & Pan support
Infinite-feel drawing workflow
Blackboard & Whiteboard modes
⚡ Performance Optimizations
O(1) incremental rendering
requestAnimationFrame throttling
Coalesced pointer events
Predicted pointer rendering
Optimized Electron bundle size
React memoization
Zustand shallow selectors
📤 Export Support

Export boards as:

PNG
JPEG
PDF
🔐 Authentication

Supabase-powered authentication:

Google Login
GitHub Login
Apple Login
📚 Board Management
Multiple boards/pages
Auto save
Undo / Redo
Board persistence
Per-user board isolation
💻 Desktop Application

Electron-powered desktop application with:

Native Windows support
macOS support
Offline support
Deep link OAuth authentication
Native desktop experience
🧱 Tech Stack
Layer	Technology
Frontend	React + Vite
Desktop	Electron
Styling	Tailwind CSS
State Management	Zustand
Drawing Engine	HTML5 Canvas API
Stroke Engine	perfect-freehand
Authentication	Supabase
Export	jsPDF
Deployment	Vercel
Testing	Playwright + Vitest
📸 Screenshots
Blackboard Mode

Add screenshots here

Whiteboard Mode

Add screenshots here

Desktop Application

Add screenshots here

🚀 Live Demo
🌐 Web Application

Blackboard Live App

📥 Desktop Download
Windows Installer (.exe)

Download the latest desktop release from:

GitHub Releases

⚙️ Installation
Clone Repository
git clone https://github.com/yash96644/BlackBoard.git
cd BlackBoard
Install Dependencies
npm install
Run Development Server
Web
npm run dev
Electron
npm run electron:dev
🏗 Production Build
Web Build
npm run build
Windows Desktop Build
npm run electron:build:win
macOS Build
npm run electron:build:mac
🧪 Testing
Run Playwright Tests
npm run test:e2e
Run Linting
npm run lint
Fix Lint Issues
npm run lint:fix
📂 Project Structure
BlackBoard/
├── electron/
├── public/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── store/
│   ├── utils/
│   ├── pages/
│   └── lib/
├── tests/
├── package.json
└── vite.config.js
🔒 Security

Blackboard follows modern Electron security practices:

contextIsolation enabled
nodeIntegration disabled
secure preload bridge
OAuth deep linking
isolated renderer process
📈 Performance
Optimizations Included
Incremental rendering pipeline
Dual canvas architecture
GPU-friendly rendering
Optimized bundle splitting
Canvas redraw minimization
🛣 Roadmap
Upcoming Features
Infinite canvas
Real-time collaboration
Cloud sync
Selection tool
Sticky notes
Shape snapping
Tauri version
Mobile support
🤝 Contributing

Contributions, suggestions, and feedback are welcome.

Fork the repository
Create a feature branch
Commit changes
Open a Pull Request
👨‍💻 Developer
Yash Kumar Gupta

Frontend Developer • Electron Enthusiast • React Developer

GitHub: yash96644 GitHub
LinkedIn: Yash Gupta LinkedIn
⭐ Support

If you like this project:

Star the repository
Share feedback
Report issues
Suggest features
📄 License

This project is licensed under the MIT License.

<div align="center">
Built with ❤️ using React, Electron, and Canvas API
</div>
