import assert from 'node:assert/strict'
import test from 'node:test'
import { cancelPolicyLine, resolveDepositAmount } from './deposit-rules.ts'

const rule = {
  depositAmount: '50',
  highTicketServices: 'Balayage, Color',
  highTicketDeposit: '100',
  cancelWindowHours: '24',
}

test('default services use the floor deposit', () => {
  assert.equal(resolveDepositAmount('Cut & style', rule), '50')
})

test('named high-ticket services use the higher deposit', () => {
  assert.equal(resolveDepositAmount('Balayage', rule), '100')
  assert.equal(resolveDepositAmount('Partial color', rule), '100')
})

test('a blank high-ticket list does not upgrade the amount', () => {
  assert.equal(
    resolveDepositAmount('Balayage', { ...rule, highTicketServices: ' ' }),
    '50',
  )
})

test('cancel window becomes one sentence', () => {
  assert.equal(cancelPolicyLine('24'), 'Cancel inside 24 hours and the studio keeps the deposit.')
  assert.equal(cancelPolicyLine('0'), '')
  assert.equal(cancelPolicyLine('1'), 'Cancel inside 1 hour and the studio keeps the deposit.')
})
