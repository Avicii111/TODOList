(function (window) {
	var task_list_ctn = []; //任务列表
	var new_todo = $(".new-todo"); //提交input
	var flag = 0; //记录状态
	
	/*  1.创建一个对像  push数组里面
		2.把数据存到浏览器
		3.把数据取出来
	*/

	//Initialization view
	init ();

	//提交的回车事件
	new_todo.keydown(function(ev) { 
		if (ev.keyCode == 13) { 
			var obj= {}; // 提交之后的存储对象
			obj.content = new_todo.val(); //把提交的content存储到对象中

			if (!obj.content) return;//content为空就返回
			console.log(obj.content)
			
			add_task(obj);//add一个task
			createHtml();//刷新页面
			new_todo.val(null); //更新页面之后，清空input
		}
	})

	//初始化界面
	function init () {
		//将数据从浏览器中去除并加进数组中
		task_list_ctn = store.get("dk")||[];
		//创建界面 
		createHtml();
	}

	//add a task 
	function add_task(obj) {
		task_list_ctn.push(obj); //把对象push到任务列表
		store.set("dk",task_list_ctn);//把数据更新到浏览器中
	}

/*
	
	###################### VIEW ###########################	

*/
	//create页面
	function createHtml() {
		var todo_list=$(".todo-list"); //获取task的任务框
		todo_list.html(null); //刷新前清空所有task再重新根据数据创建
		var completed = []; //已经completed
		for (var i = 0; i < task_list_ctn.length; i++) { //创建task
			if (task_list_ctn[i].completed) { 
			//将已经completed 的push进 compalted数组
				completed.push(task_list_ctn[i]);
			}
			var task = bindHtml(task_list_ctn[i],i);
			todo_list.append(task); //追加task
		};

		if (flag == 1) { //active btn
			todo_list.html(null); 
			for (var i = 0; i < task_list_ctn.length; i++) { //创建task
				if (!task_list_ctn[i].completed) {
					var task = bindHtml(task_list_ctn[i],i);
					todo_list.append(task); //追加task
				}	
			}
			flag = 0;
			store.set("judge",{all:true});
		}else if (flag == 2) { //completed btn
			todo_list.html(null); 
			for (var i = 0; i < task_list_ctn.length; i++) { //创建task
				if (task_list_ctn[i].completed) {
					var task = bindHtml(task_list_ctn[i],i);
					todo_list.append(task); //追加task
				}	
			}
			flag = 0;
			store.set("judge",{all:true});
		}

		deleteTask(); //match to delete Li
		add_completed(); //completed LIST
		completedAll(); //全选
		btnCtl(); //全选arrow
		itemLeft(completed); //left task
		allBtn();	//all Btn
		activeBtn();//activeBtn
		completedBtn(); //completedBtn
		clearCompletedBtn();//clearCompletedBtn
	}

	//bind页面
	function bindHtml(data,index) {
		//创建任务条目Li 
		var str ='<li data-index='+index+' class='+(data.completed ? "completed" : "")+'>'+ //方便事件监控
					'<div class="view">'+
						'<input class="toggle" type="checkbox" '+
						(data.completed ? "checked" : "")+'>'+ //选择判断
						'<label>'+data.content+'</label>'+
						'<button class="destroy"></button>'+
					'</div>'+
					'<input class="edit" value="Rule the web">'+
				'</li>';

		return str;//返回Li
	}

/*
	
	###################### DELETE ###########################	
	
*/
	//删除task
	function deleteTask() {
		$(".destroy").click(function() { //获取btn
			//获取对应Li的index
			var index = $(this).parent().parent().data("index");
			console.log("want to close this index : "+index)
			//移除对应的task
			reomve_task(index);
		});
	}

	//移除task
	function reomve_task(index) {
		task_list_ctn.splice(index,1); //移除index
		refresh_task_list();  //更新taskList
	}

	//更新taskList
	function refresh_task_list () {
		store.set("dk",task_list_ctn); //更新本地存储
		createHtml(); //更新taskList
	}

/*
	
	###################### COMPLETE ###########################	
	
*/
	//选择对应的完成情况
	function add_completed () {
		//获取checkbox
		var isComplate = $(".todo-list .view .toggle");
		isComplate.click(function() { //checkbox点击事件
			//获取对应Li的index和对象
			var index = $(this).parent().parent().data("index");
			var target = $(this).parent().parent();
			console.log("Completed this task and index : "+index)
			console.log("its grandpa is : "+target+" "+index)

			//判断是否完成
			if (task_list_ctn[index].completed) { //取消完成
				//修改对应的本地数据
				updateLocalStorage({completed:false},index); 
				target.removeClass('completed');//移除对应的类名
			}else{
				//修改对应的本地数据
				updateLocalStorage({completed:true},index);
				target.addClass('completed');//添加对应的类名
			}
			dgAll ();//判断全选
			createHtml();//更新页面
		});
	}
	
	//all的完成情况
	function completedAll() {
		var all = $(".main").find('label').eq(0);
		var target = $(this).parent().parent();
		$(all).off();
		$(all).on('click', function(event) {
			event.preventDefault();
			toAll(target);//全选工具
			createHtml();
		});
	}

	//判断全选
	function dgAll () {
		var flag = true;
		for (var i = 0; i < task_list_ctn.length; i++) {
			if (!task_list_ctn[i].completed) {
				flag = false; //如果有
			}
		}
		if (!flag) {
			store.set("judge",{all:true});
		}else{
			store.set("judge",{all:false});
		}
	}

	//全选箭头控制
	function btnCtl(){
		var alljg = store.get("judge")||{};
		if (!alljg.all) {
			$(".main .toggle-all").prop("checked",true)
		}else{
			$(".main .toggle-all").prop("checked",false)
		}
		// console.log($(".main .toggle-all").prop("checked"))
	}

/*
	
	###################### LEFT ###########################	
	
*/
	//count how many task havent completed 
	function itemLeft(completed) {
		$(".footer .todo-count").find('strong').text(
			task_list_ctn.length-completed.length)
	}

/*
	
	###################### BUTTON ###########################	
	
*/	
	//全选按钮
	function allBtn(){
		var target = $(".footer .filters li").find('a').eq(0);
		target.off();
		target.on('click', function(event) {
			event.preventDefault();
			var btnIndex = $(this).index();
			toAll(target); //全选工具
			btnSelected(btnIndex); //边框工具
			createHtml();
		});
	}

	//active按钮
	function activeBtn(){
		var target = $(".footer .filters li").find('a').eq(1);
		var btnIndex = target.parent().index();
		target.off();
		target.on('click', function(event) {
			event.preventDefault();
			flag = btnIndex; //设置flag 更新界面
			btnSelected(btnIndex); //边框
			createHtml(btnIndex);
		});
	}

	//completed按钮
	function completedBtn(){
		var target = $(".footer .filters li").find('a').eq(2);
		var btnIndex = target.parent().index();
		/*↓↓ 可以获取但是很 流氓
		var btnIndex = $(".footer .filters li").find('a').eq(2).index;*/
		target.off();
		target.on('click', function(event) {
			event.preventDefault();
			flag = btnIndex; //设置flag 更新界面
			btnSelected(btnIndex); //边框
			createHtml(btnIndex); 
		});
	}

	//clearCompleted按钮
	function clearCompletedBtn(){
		var target = $(".footer .clear-completed");
		var num = 0;
		target.off(); //关闭事件
		target.on('click', function(event) {  //开启事件
			event.preventDefault(); //防止冒泡
			for (var i = 0; i < task_list_ctn.length; i++) {
				if (task_list_ctn[i].completed) { 
					var temp = task_list_ctn[i];
					task_list_ctn.splice(i,1); //已经completed
					task_list_ctn.unshift(temp)
					console.log("length : "+task_list_ctn.length)
				}else{
					++num; 
				}
			}
			console.log(num)
			task_list_ctn.splice(0,task_list_ctn.length-num);
			console.log(task_list_ctn)
			console.log(num)
			store.set("dk",task_list_ctn); //更新本地存储
			createHtml(); //更新taskList
		});
	}

/*
	
	######################   ╔════╦════╗   ######################	
							 ║		   ║
	######################   ╠  TOOLS  ╣   ######################	
							 ║		   ║
	######################   ╚════╩════╝   ######################	
	
	#######################	 ↓↓↓↓↓↓↓↓↓↓↓  #######################
	########################  ↓↓↓↓↓↓↓↓↓  ########################
	#########################  ↓↓↓↓↓↓↓  #########################
	##########################	↓↓↓↓↓  ##########################
	###########################  ↓↓↓  ###########################
	############################  ↓  ############################
*/

/*
	
	###################### UPDATE ###########################	
	
*/
	//更新本地存储
	function updateLocalStorage(newData,index) {
		//更新本地存储
		task_list_ctn[index] = $.extend({},task_list_ctn[index],newData);
		store.set("dk",task_list_ctn);
	}

/*
	
	###################### TOALL ###########################	
	
*/
	//全选工具
	function toAll(target){
		var alljg = store.get("judge")||{}; //获取全选flag
		if (alljg.all) { //true 即 全选
			for (var i = 0; i < task_list_ctn.length; i++) {
				//修改对应的本地数据
				updateLocalStorage({completed:true},i);
				target.addClass('completed');//添加对应的类名
			}
			store.set("judge",{all:false});  //设为 false 表示 下次为不全选
		}else{ 	//false 不全选 
			for (var i = 0; i < task_list_ctn.length; i++) {
				//修改对应的本地数据
				updateLocalStorage({completed:false},i); 
				target.removeClass('completed');//移除对应的类名
			}
			store.set("judge",{all:true}); //设为 true 表示 下次为全选
		}
	}

/*
	
	###################### BTNSELECTED ###########################	
	
*/
	//Selected框
	function btnSelected(index){
		console.log("selected this index:　"+index)
		//获取footer 的 a 成员 并将其变成jq对象
		var btnA = $(".footer .filters li").find('a');
		for (var i = 0; i < btnA.length; i++) { 
			$(btnA).eq(i).removeClass("selected")//情况边框
		}
		$(btnA).eq(index).addClass("selected") //为选中的添加边框
	}

})(window);
