// // vite.config.ts
// import { reactRouter } from "file:///C:/Users/User/Documents/fe-helpverse/node_modules/.pnpm/@react-router+dev@7.5.1_@re_461469edd158ee3394e305a5ce94f09f/node_modules/@react-router/dev/dist/vite.js";
// import tailwindcss from "file:///C:/Users/User/Documents/fe-helpverse/node_modules/.pnpm/@tailwindcss+vite@4.1.4_vit_5ebbd76e1231b0bca86050f02e41751a/node_modules/@tailwindcss/vite/dist/index.mjs";
// import { defineConfig, loadEnv } from "file:///C:/Users/User/Documents/fe-helpverse/node_modules/.pnpm/vite@5.4.18_@types+node@20.17.30_lightningcss@1.29.2/node_modules/vite/dist/node/index.js";
// import tsconfigPaths from "file:///C:/Users/User/Documents/fe-helpverse/node_modules/.pnpm/vite-tsconfig-paths@5.1.4_t_49229fd0bc7ca1f13b687613ef011bf9/node_modules/vite-tsconfig-paths/dist/index.js";
// var vite_config_default = defineConfig(({ mode }) => {
//   const env = loadEnv(mode, process.cwd(), "");
//   const apiUrl = env.BASE_URL_API || "http://localhost:5000";
//   return {
//     plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
//     define: {
//       "import.meta.env.BASE_URL_API": JSON.stringify(env.BASE_URL_API)
//     },
//     server: {
//       proxy: {
//         "/api": {
//           target: apiUrl.replace("/api", ""),
//           changeOrigin: true,
//           secure: false,
//           rewrite: (path) => path,
//           configure: (proxy, _options) => {
//             proxy.on("error", (err, _req, _res) => {
//               console.log("proxy error", err);
//             });
//             proxy.on("proxyReq", (proxyReq, req, _res) => {
//               console.log("Sending Request to the Target:", req.method, req.url);
//             });
//             proxy.on("proxyRes", (proxyRes, req, _res) => {
//               console.log("Received Response from the Target:", proxyRes.statusCode, req.url);
//             });
//           }
//         }
//       },
//       cors: true
//     }
//   };
// });
// export {
//   vite_config_default as default
// };
// //# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxVc2VyXFxcXERvY3VtZW50c1xcXFxmZS1oZWxwdmVyc2VcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXFVzZXJcXFxcRG9jdW1lbnRzXFxcXGZlLWhlbHB2ZXJzZVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvVXNlci9Eb2N1bWVudHMvZmUtaGVscHZlcnNlL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgcmVhY3RSb3V0ZXIgfSBmcm9tIFwiQHJlYWN0LXJvdXRlci9kZXYvdml0ZVwiO1xyXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSBcIkB0YWlsd2luZGNzcy92aXRlXCI7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gXCJ2aXRlXCI7XHJcbmltcG9ydCB0c2NvbmZpZ1BhdGhzIGZyb20gXCJ2aXRlLXRzY29uZmlnLXBhdGhzXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XHJcbiAgLy8gTG9hZCBlbnYgZmlsZSBiYXNlZCBvbiBgbW9kZWAgaW4gdGhlIGN1cnJlbnQgZGlyZWN0b3J5LlxyXG4gIC8vIFNldCB0aGUgdGhpcmQgcGFyYW1ldGVyIHRvICcnIHRvIGxvYWQgYWxsIGVudiByZWdhcmRsZXNzIG9mIHRoZSBgVklURV9gIHByZWZpeC5cclxuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCksICcnKTtcclxuXHJcbiAgY29uc3QgYXBpVXJsID0gZW52LkJBU0VfVVJMX0FQSSB8fCAnaHR0cDovL2xvY2FsaG9zdDo1MDAwJztcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHBsdWdpbnM6IFt0YWlsd2luZGNzcygpLCByZWFjdFJvdXRlcigpLCB0c2NvbmZpZ1BhdGhzKCldLFxyXG4gICAgZGVmaW5lOiB7XHJcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuQkFTRV9VUkxfQVBJJzogSlNPTi5zdHJpbmdpZnkoZW52LkJBU0VfVVJMX0FQSSlcclxuICAgIH0sXHJcbiAgICBzZXJ2ZXI6IHtcclxuICAgICAgcHJveHk6IHtcclxuICAgICAgICAnL2FwaSc6IHtcclxuICAgICAgICAgIHRhcmdldDogYXBpVXJsLnJlcGxhY2UoJy9hcGknLCAnJyksXHJcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgICBzZWN1cmU6IGZhbHNlLFxyXG4gICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgsXHJcbiAgICAgICAgICBjb25maWd1cmU6IChwcm94eSwgX29wdGlvbnMpID0+IHtcclxuICAgICAgICAgICAgcHJveHkub24oJ2Vycm9yJywgKGVyciwgX3JlcSwgX3JlcykgPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdwcm94eSBlcnJvcicsIGVycik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBwcm94eS5vbigncHJveHlSZXEnLCAocHJveHlSZXEsIHJlcSwgX3JlcykgPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdTZW5kaW5nIFJlcXVlc3QgdG8gdGhlIFRhcmdldDonLCByZXEubWV0aG9kLCByZXEudXJsKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHByb3h5Lm9uKCdwcm94eVJlcycsIChwcm94eVJlcywgcmVxLCBfcmVzKSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1JlY2VpdmVkIFJlc3BvbnNlIGZyb20gdGhlIFRhcmdldDonLCBwcm94eVJlcy5zdGF0dXNDb2RlLCByZXEudXJsKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgY29yczogdHJ1ZVxyXG4gICAgfVxyXG4gIH07XHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXdTLFNBQVMsbUJBQW1CO0FBQ3BVLE9BQU8saUJBQWlCO0FBQ3hCLFNBQVMsY0FBYyxlQUFlO0FBQ3RDLE9BQU8sbUJBQW1CO0FBRTFCLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBR3hDLFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLEdBQUcsRUFBRTtBQUUzQyxRQUFNLFNBQVMsSUFBSSxnQkFBZ0I7QUFFbkMsU0FBTztBQUFBLElBQ0wsU0FBUyxDQUFDLFlBQVksR0FBRyxZQUFZLEdBQUcsY0FBYyxDQUFDO0FBQUEsSUFDdkQsUUFBUTtBQUFBLE1BQ04sZ0NBQWdDLEtBQUssVUFBVSxJQUFJLFlBQVk7QUFBQSxJQUNqRTtBQUFBLElBQ0EsUUFBUTtBQUFBLE1BQ04sT0FBTztBQUFBLFFBQ0wsUUFBUTtBQUFBLFVBQ04sUUFBUSxPQUFPLFFBQVEsUUFBUSxFQUFFO0FBQUEsVUFDakMsY0FBYztBQUFBLFVBQ2QsUUFBUTtBQUFBLFVBQ1IsU0FBUyxDQUFDLFNBQVM7QUFBQSxVQUNuQixXQUFXLENBQUMsT0FBTyxhQUFhO0FBQzlCLGtCQUFNLEdBQUcsU0FBUyxDQUFDLEtBQUssTUFBTSxTQUFTO0FBQ3JDLHNCQUFRLElBQUksZUFBZSxHQUFHO0FBQUEsWUFDaEMsQ0FBQztBQUNELGtCQUFNLEdBQUcsWUFBWSxDQUFDLFVBQVUsS0FBSyxTQUFTO0FBQzVDLHNCQUFRLElBQUksa0NBQWtDLElBQUksUUFBUSxJQUFJLEdBQUc7QUFBQSxZQUNuRSxDQUFDO0FBQ0Qsa0JBQU0sR0FBRyxZQUFZLENBQUMsVUFBVSxLQUFLLFNBQVM7QUFDNUMsc0JBQVEsSUFBSSxzQ0FBc0MsU0FBUyxZQUFZLElBQUksR0FBRztBQUFBLFlBQ2hGLENBQUM7QUFBQSxVQUNIO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxNQUNBLE1BQU07QUFBQSxJQUNSO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
