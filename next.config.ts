import type { NextConfig } from 'next'
import { cwd } from 'node:process'

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: cwd()
  }
  // experimental: {
  //   useTypeScriptCli: true,
  // },
}

export default nextConfig
