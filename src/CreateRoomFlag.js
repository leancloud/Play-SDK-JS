/**
 * 创建房间标识
 * @readonly
 * @enum {number}
 */
const CreateRoomFlag = {
  /**
   * Master 掉线后固定 Master
   */
  FixedMaster: 1,
  /**
   * 只允许 Master 设置房间属性
   */
  MasterUpdateRoomProperties: 2,
  /**
   * 只允许 Master 设置 Master
   */
  MasterSetMaster: 4,
};

export default CreateRoomFlag;
