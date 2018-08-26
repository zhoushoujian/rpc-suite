# RPC（Remote Procedure Call） suite

````远程执行机操作系统:centos,kali,windows7,windows2008````
1. remote_test.js提供操纵远程机器的启停开关（开关必须只有一处）,可选择指定的机器运行
2. 可以同时调用多台远程机器进行操作，先执行完的机器先打印结果,所有执行机执行完主控机才执行下面的操作
3. 提供并行执行的方法,只要有一个执行机执行完,主控机即可进行其他操作
4. 服务端程序入口是watch.js，可以监控文件的变化，文件改改变后自动重启服务器
5. 开启多线程服务器后判断如果是多核处理器，会启用一个核心每20秒打印当前cpu使用率和内存使用情况(支持windows和linux),只记录日志不回显控制台
6. 执行前进行远程机状态检查，远程机状态ok会返回远程机ip和远程机的cpu和内存使用情况(支持windows和linux),远程机状态检查也可单独运行
7. 执行前的检查如果不通过将终止运行程序,远程机终止执行任务(不支持远程机单核)
8. 提供取消指定远程机执行的操作（支持单核,支持windows和linux）
9. 主控机执行前先检查执行及状态，再重置状态，重置后再次检查状态，确认无误后才执行任务操作
10. 提供远程机ip和端口的资源池，池内资源不可变动，只能更改外部的变量以适应变化
11. 服务端收到请求或数据时必须打印请求或数据以确认状态
12. 执行任务过程中重置其中的一台或多台远程机状态不会影响主程序和其他远程机的执行
13. 任务执行期间,远程机每隔20秒打印cpu和内存信息,并发送到主控机控制台,任务执行结束,停止打印(不支持主控机单核处理器))
14. 增加执行任务的时间统计,执行任务的时间不包括远程机状态检查和状态重置
15. 在主控机按下ctrl+c时提示用户请手动运行reset_remote.js以停止远程机的任务执行

未完成：
nodejs对于windows和linux的有些操作不能完全兼容可以理解(process.kill(pid)),而centos和kali的有些命令竟然也不能兼容,那就简直差评了(获取cpu使用率)
提供多核处理计算任务(nodejs适合io密集型，不适合cpu密集型)