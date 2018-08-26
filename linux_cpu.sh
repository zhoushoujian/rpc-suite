#!/bin/bash
	#获取cpu使用率
	#cpuuser=`sar -P 0 -u 1 3 | grep "平均时间" | awk "{print $3}"`
	#cpunice=`sar -P 0 -u 1 3 | grep "平均时间" | awk "{print $4}"`
	#cpusys=`sar -P 0 -u 1 3 | grep "平均时间" | awk "{print $5}"`
	#cputotal=`awk 'BEGIN{printf"%.2f%\n",'$cpuuser'+'$cpunice'+'$cpusys'}'`
	#根据cpu核心数量来执行下面命令的次数,我这里是双核,所以执行两次
	#last free cpu usage
    cpufree1=`sar -P 0 -u 1 3 | grep "平均时间" | awk "{print $8}"`
    cpufree2=`sar -P 0 -u 1 3 | grep "平均时间" | awk "{print $8}"`
	echo cpu1 info:$cpufree1
    echo cpu2 info:$cpufree2
	#获取磁盘使用率
	#获取内存情况
	phymem=`free -m |grep "Mem" | awk '{print $2}'`
	echo total mem:$phymem
	phymemused=`free -m |grep "Mem" | awk '{print $3}'`
	echo useage mem:$phymemused
	#统计内存使用率
	phymempercent=`awk 'BEGIN{printf"%.2f%\n",('$phymemused'/'$phymem')*100}'`
	echo mem usage percent:$phymempercent
