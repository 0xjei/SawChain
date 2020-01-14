'use strict';

const {getTaskTypeAddress, getSystemAdminAddress} = require('../services/addressing');
const {TaskType, SystemAdmin} = require('../services/proto');
const {reject} = require('../services/utils');

async function createTaskType(context, signerPublicKey, timestamp, id, role) {
    // Validation: Timestamp not set.
    if (!timestamp.low && !timestamp.high)
        reject(`Timestamp is not set!`);

    // Validation: Id is not set.
    if (!id)
        reject(`Id is not set!`);

    // Validation: Role is not set.
    if (!role)
        reject(`Role is not set!`);

    const systemAdminAddress = getSystemAdminAddress();
    const taskTypeAddress = getTaskTypeAddress(id);

    const state = await context.getState([
        systemAdminAddress,
        taskTypeAddress
    ]);

    const adminState = SystemAdmin.decode(state[systemAdminAddress]);

    // Validation: Sender is not the System Admin.
    if (adminState.publicKey !== signerPublicKey)
        reject(`You must be the System Admin to create a type!`);

    // Validation: Id is not unique for task types.
    if (state[taskTypeAddress].length > 0)
        reject(`Given id is already used in a different task type!`);

    // State update.
    const updates = {};

    updates[getTaskTypeAddress(id)] = TaskType.encode({
        id: id,
        role: role
    }).finish();

    await context.setState(updates)
}

module.exports = {createTaskType};