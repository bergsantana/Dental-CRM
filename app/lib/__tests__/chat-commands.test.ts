import { strict as assert } from "node:assert"
import { describe, it } from "node:test"
import { parseChatCommand, CHAT_HELP_TEXT } from "../chat-commands.ts"

describe("parseChatCommand", () => {
  it("returns help for /ajuda", () => {
    const r = parseChatCommand("/ajuda")
    assert.equal(r.kind, "help")
    assert.equal(r.message, CHAT_HELP_TEXT)
  })

  it("returns unknown for non-slash", () => {
    const r = parseChatCommand("listar")
    assert.equal(r.kind, "unknown")
  })

  it("parses /listar with default limit", () => {
    const r = parseChatCommand("/listar")
    assert.equal(r.kind, "action")
    assert.equal(r.payload?.kind, "list_upcoming")
    assert.equal(r.payload?.mode, "preview")
  })

  it("parses /listar limite=5", () => {
    const r = parseChatCommand("/listar limite=5")
    assert.equal(r.kind, "action")
    assert.equal(r.payload?.args?.limit, 5)
  })

  it("ignores out-of-range limit (BE validates)", () => {
    const r = parseChatCommand("/listar limite=999")
    assert.equal(r.kind, "action")
    assert.equal(r.payload?.args?.limit, undefined)
  })

  it("parses /confirmar <uuid>", () => {
    const id = "11111111-1111-4111-8111-111111111111"
    const r = parseChatCommand(`/confirmar ${id}`)
    assert.equal(r.kind, "action")
    assert.equal(r.payload?.kind, "approve")
    assert.equal(r.payload?.args?.appointmentId, id)
  })

  it("rejects /confirmar without uuid", () => {
    const r = parseChatCommand("/confirmar abc")
    assert.equal(r.kind, "error")
  })

  it("parses /cancelar with reason", () => {
    const id = "22222222-2222-4222-8222-222222222222"
    const r = parseChatCommand(`/cancelar ${id} motivo="paciente desistiu"`)
    assert.equal(r.kind, "action")
    assert.equal(r.payload?.kind, "cancel")
    assert.equal(r.payload?.args?.reason, "paciente desistiu")
  })

  it("parses /criar with all fields", () => {
    const dentista = "33333333-3333-4333-8333-333333333333"
    const r = parseChatCommand(
      `/criar dentista=${dentista} data="2099-01-15 10:00" duracao=45 motivo="limpeza"`,
    )
    assert.equal(r.kind, "action")
    assert.equal(r.payload?.kind, "create")
    assert.equal(r.payload?.args?.dentistId, dentista)
    assert.equal(r.payload?.args?.durationMinutes, 45)
    assert.equal(r.payload?.args?.reason, "limpeza")
    assert.ok(r.payload?.args?.startsAt, "startsAt must be set")
    assert.ok(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(r.payload!.args!.startsAt!),
      "startsAt must look ISO-ish",
    )
  })

  it("rejects /criar missing fields", () => {
    const r = parseChatCommand("/criar dentista=foo")
    assert.equal(r.kind, "error")
  })

  it("parses /remarcar", () => {
    const id = "44444444-4444-4444-8444-444444444444"
    const r = parseChatCommand(`/remarcar ${id} data="2099-02-01 09:30"`)
    assert.equal(r.kind, "action")
    assert.equal(r.payload?.kind, "reschedule")
    assert.equal(r.payload?.args?.appointmentId, id)
    assert.ok(r.payload?.args?.startsAt)
  })

  it("supports aliases /agendar and /aprovar", () => {
    const dentista = "55555555-5555-4555-8555-555555555555"
    const r1 = parseChatCommand(
      `/agendar dentista=${dentista} data="2099-03-01 11:00" duracao=30 motivo="rev"`,
    )
    assert.equal(r1.payload?.kind, "create")

    const id = "66666666-6666-4666-8666-666666666666"
    const r2 = parseChatCommand(`/aprovar ${id}`)
    assert.equal(r2.payload?.kind, "approve")
  })
})
