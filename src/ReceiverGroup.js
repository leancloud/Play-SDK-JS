/**
 * 接收组枚举
 * @readonly
 * @enum {number}
 */
const ReceiverGroup = {
  /** 其他人（除了自己之外的所有人） */
  Others: 0,
  /** 所有人（包括自己） */
  All: 1,
  /** 主机客户端 */
  MasterClient: 2,
};

export default ReceiverGroup;
