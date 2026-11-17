"use client"

import * as React from "react"

import { REMEMBERED_EMAIL_KEY } from "../_lib/auth-constants"

// 监听 storage 事件：同一浏览器的其他窗口修改邮箱时可同步过来。
// 注意同一窗口自己写入不会触发 storage，所以组件内仍用本地 state 覆盖显示值。
function subscribeToRememberedEmail(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange)
  return () => window.removeEventListener("storage", onStoreChange)
}

// 没有保存过邮箱时返回空串，与“未记住邮箱”的初始值保持一致。
function getRememberedEmail() {
  return window.localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? ""
}

// 静态导出的服务端首屏没有 localStorage；快照必须是稳定空值，客户端挂载后再读真实值。
function getServerRememberedEmail() {
  return ""
}

/**
 * 登录页的邮箱记忆：只读写邮箱，不接触密码。
 * 服务端快照固定为空，避免静态导出首屏与客户端存储不一致。
 */
export function useRememberedEmail() {
  // localStorage 只在客户端可读；useSyncExternalStore 让服务端快照为空、客户端恢复邮箱，
  // 避免在 effect 里同步 setState 造成二次渲染。
  const storedEmail = React.useSyncExternalStore(
    subscribeToRememberedEmail,
    getRememberedEmail,
    getServerRememberedEmail,
  )
  const [email, setEmail] = React.useState<string | null>(null)
  const [remember, setRemember] = React.useState<boolean | null>(null)

  function save(emailToSave: string) {
    // 只保存邮箱并去掉首尾空格；密码永远不会进入这里。
    window.localStorage.setItem(REMEMBERED_EMAIL_KEY, emailToSave.trim())
  }

  function clear() {
    // 只删除本功能的 key，不清空其他本地数据。
    window.localStorage.removeItem(REMEMBERED_EMAIL_KEY)
  }

  return {
    // 用户输入过的值优先；没有输入过才回落到本地保存的邮箱。
    email: email ?? storedEmail,
    // 本地有邮箱时默认勾选“记住邮箱”；用户手动取消后以本地状态为准。
    remember: remember ?? Boolean(storedEmail),
    setEmail,
    setRemember,
    save,
    clear,
  }
}
