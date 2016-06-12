/*@auther alfred.qiu*/

(function($,window){

var ChironSearch=function(element,options){
	this.version="0.0.1";
  	this.$trigger=$(element);
  	this.originOptions=$.extend(true,{},options);
  	this.options=$.extend(true,{},options);

  	this.init();
};

ChironSearch.DEFAULTS={
	data:[],// [{field:,value:}]
	selectedData:[],// [{field:,value:}] or []
	sideSearch:"client",// "client" or "server"
	removeIcon:"glyphicon glyphicon-trash",
	zIndex:0,
	dropdownHeight:200,
	dropdownClass:"",
	dropdownItemClass:"",
	resultClass:"",
	resultItemClass:"",
	removeClass:"",
	sortable:false,
	sortOrder:"asc",// "desc" or "asc"
	method: 'get',
	url: undefined,
	ajax: undefined,
	cache: true,
	contentType: 'application/json',
	dataType: 'json',
	name:"searchText",
	uploadForm:"",// "" or "input" or "select"
	queryParam:{},
	dealy:300,
	formatResponse:function(res){
	  	return res.data;
	},
	formatSorter:function(value){
		return value;
	},
	sorter:function(a,b){
		return 1;
	},
	formatDropdown:function(value){
	  	return value;
	},
	formatResult:function(value){
		return value;
	},
	success:function(res){
		return true;
	},
	error:function(res){
		return true;
	}
};

ChironSearch.prototype.init=function(){
	this.initData();
	this.bindSearchEvent();
	this.initResult();
};

ChironSearch.prototype.initData=function(){
	if ( !$.isEmptyObject(this.options.selectedData) ){
		if ( $.type(this.options.selectedData[0])=="object" ){
			this.options.originSelected=$.extend([],this.options.selectedData,true);
		};

		if ( $.type(this.options.selectedData[0])=="string" || $.type(this.options.selectedData[0])=="number" ){
			this.options.originSelected=$.grep(this.options.data,function(item,index){
				if ( this.options.selectedData.indexOf(item.field)!=-1 ){
					return true;
				};
			});

			this.options.selectedData=$.extend([],this.options.originSelected,true);
		};

	};

	if ( !$.isEmptyObject(this.options.data) ){
		this.originData=$.extend([],this.options.data,true);
	};

	if ( this.$trigger.attr("name") ){
		this.options.name=this.$trigger.attr("name");
		this.$trigger.removeAttr("name");
	};
};

// Bind basic event when chironSelect pulgin is initializing.
ChironSearch.prototype.bindSearchEvent=function(){
	var that=this;

	this.$trigger.off("keyup").on("keyup",function(event){
		var which=event.which,
		isValiated=( which>=65 && which<=90) || (which>=48 && which<=57) || which==8 || which==13
			|| which==16 || which==32 || (which>=96 && which<=105 );

		if ( !isValiated ) return;

		if ( $(this).val().trim()=="" ){
			$(this).siblings(".chiron-search-dropdown").remove();
			return;
		};

		that.options.value=that.$trigger.val().trim();

		setTimeout(function(){
			if ( that.options.sideSearch=="server" ){
				that.initServer.call(that);
			}else{
				that.updateData.call(that);
			};
		},that.options.dealy);
	});

	if ( that.options.sideSearch=="client" ){
		this.$trigger.off("click").on("click",function(event){
			that.updateData.call(that);
		});
	};

	$(document).on("click",function(event){
		if ( !$(event.target).is(that.$trigger) && that.$dropdown ) that.$dropdown.remove();
	});
};

// Do Ajax.
ChironSearch.prototype.initServer=function(){
  	var that=this,
	    name,data={};

	data[this.options.name]=this.options.value;

	if ( $.isEmptyObject(this.options.queryParam) ){
		$.extend(data,this.options.queryParam);
	};

	var request={
		type: this.options.method,
      	url: this.options.url,
      	data: this.options.contentType==='application/json' && this.options.method==='post' ?
          	JSON.stringify(data):data,
      	cache: this.options.cache,
      	contentType: this.options.contentType,
      	dataType: this.options.dataType,
      	success: function (res) {
			that.options.success.call(this,res);
      		that.$trigger.trigger("success:chironSearch",res);
      		that.updateData(res);
      	},
      	error: function (res) {
			that.options.error.call(this,res);
      		that.$trigger.trigger("error:chironSearch",res);
    	}
    };

	$.ajax(request);
};

// Update data after Ajax,then sort data.
ChironSearch.prototype.updateData=function(res){
	var that=this;

	if ( this.options.sideSearch=="server" && res ){
		that.options.data=that.options.formatResponse(res);
	}else{
		var value=this.options.value,
			reg=new RegExp(value);

		this.options.data=$.extend([],this.originData,true);

		this.options.data=$.grep(this.options.data,function(item,index){
			if ( String(item.field).match(reg) || item.value.match(reg) ) return true;
			return false;
		});
	};

	$.each(this.options.data,function(index,item){
		if (item.html) return;
		item.html=item.value;
	});

	if ( this.options.sortable ){
		this.initSort();
	};

	this.makeUnique();

	this.initDropDown();
};

// Make items of data array is unique by property filed.
ChironSearch.prototype.makeUnique=function(){
	var that=this,
		fields=[];

	this.options.data=$.grep(this.options.data,function(item,index){
		if ( fields.indexOf(item.field)==-1 ){
			fields.push(item.field);
			return true;
		}else{
			return false;
		}
	});
};

// Sort items of data array.
ChironSearch.prototype.initSort=function(){
	var that=this,
		order = this.options.sortOrder=='desc'?-1:1;

	this.options.data.sort(function(a,b){
		var aa=that.options.formatSorter(a.html),
			bb=that.options.formatSorter(b.html),
			sorter=that.options.sorter(aa,bb);

		if ( sorter!=undefined ){
        	return order*sorter;
	    };

	    if ($.isNumeric(aa) && $.isNumeric(bb)) {
	        aa = parseFloat(aa);
	        bb = parseFloat(bb);
	        if (aa < bb) {
	            return order * -1;
	        };
	        return order;
	    };

	    if (aa === bb) {
	        return 0;
	    };

	    if (typeof aa!=='string') {
	        aa=aa.toString();
	    };

	    if (aa.localeCompare(bb)===-1) {
	        return order*-1;
	    };

	    return order;
	});
};

// Append dropdown and bind enevt.
ChironSearch.prototype.initDropDown=function(){
	var that=this,
		html=[];

	if ( this.$dropdown && this.$dropdown.length ){
		this.$dropdown.html("");
	}else{
		this.$trigger.parent().append("<ul class='chiron-search-dropdown'></ul>");
	};

	this.$dropdown=this.$trigger.siblings(".chiron-search-dropdown");

	this.$dropdown.addClass(that.options.dropdownClass);

	$.each(that.options.data,function(index,item){
		var dropdownItem=that.options.formatDropdown(item.html);
		html.push(
			"<li data-field='",
			item.field,
			"' data-value='",
			item.value,
			"' class='chiron-search-dropdown-item'><a>",
			dropdownItem,
			"</a></li>"
		);
	});

	html=html.join("");

	this.$dropdown.append(html);

	that.$trigger.trigger("open:chironSearch",that.$dropdown);

	this.$dropdownItem=this.$dropdown.find(".chiron-search-dropdown-item");

	this.$dropdownItem.addClass(that.options.dropdownItemClass);

	this.place();

	// Mark the selected items of dropdown.
	if ( !$.isEmptyObject(this.options.selectedData) ){
		$.each(this.options.selectedData,function(index,item){
			that.$dropdownItem.filter("[data-field='"+item.field+"']").addClass("active");
		});
	};

	this.$dropdownItem.off("click").on("click",function(event){
		event.stopPropagation();

		var self=this,
			field=$(this).data("field"),
			value=$(this).data("value");

		that.$trigger.val("");

		that.$trigger.trigger("select:chironSearch",self);

		that.updateSelectedData.call(that,field,value);

		that.$dropdown.remove();
		delete that.$dropdown;
	});
};

// Set the place of dropdown,and adjust dropdown's width and height.
ChironSearch.prototype.place=function(){
	var that=this,
		top=this.$trigger.offset().top-this.$trigger.parent().offset().top,
		height=this.$trigger.outerHeight(),
		left=this.$trigger.offset().left-this.$trigger.parent().offset().left,
		width=this.$trigger.innerWidth();

	top=top+height;

	if (!this.options.zIndex) {
      	var index_highest = 0;

      	$('div').each(function () {
      		var index_current=parseInt($(this).css('zIndex'), 10);

	      	if ( index_current>index_highest ) {
	            index_highest=index_current;
	      	};
      	});

      	this.options.zIndex=index_highest+10;
	};

	this.$trigger.parent().css({position:"relative"});
	this.$dropdown.css({position:"absolute",top:top,left:left,"z-index":that.options.zIndex})
		.width(width);

	height=this.$dropdown.height();

	if ( height>this.options.dropdownHeight ){
		$scroll=$("<div style='width:20px;height:100px;overflow:scroll'></div>").appendTo(document.body);
		$scrollChild=$("<div style='width:100%;height:120px'>").appendTo($scroll);

		var scrollWidth=$scroll.innerWidth()-$scrollChild.innerWidth();

		$scroll.remove();

		this.$dropdown.css({"overflow":"auto"})
			.width(width).height(that.options.dropdownHeight);
		this.$dropdownItem.find(".chiron-search-dropdown-item").width(width-scrollWidth);
	};

	this.options.dropdownHeight=height;

	this.$trigger.trigger("place:chironSearch",that.$dropdown);
};

// Update selected data.
ChironSearch.prototype.updateSelectedData=function(field,value){
	var that=this,
		isRepeated=false;

	$.each(this.options.selectedData,function(inde,item){
		if ( item.field==field ){
			isRepeated=true;
		};
	});

	if (!isRepeated){
		that.options.selectedData.push({field:field,value:value});

		that.$trigger.trigger("update:chironSearch",that.options.selectedData);

		that.$trigger.trigger("add:chironSearch",{field:field,value:value});

		that.initResult.call(that,{field:field,value:value});
	};
};

// render selected items of data.
ChironSearch.prototype.initResult=function(addItem){
	var that=this,
		html=[],
		deleteIndex;

	if ( this.$result ){
		html.push(
			"<span data-field='",
			addItem.field,
			"' class='chiron-search-result-item'>",
			addItem.value,
			"<span class='chiron-search-result-remove ",
			that.options.removeIcon,
			"'></span></span>"
		);
	}else{
		this.$trigger.parent().append("<div class='chiron-search-result'></div>");

		this.$result=this.$trigger.siblings(".chiron-search-result");

		this.$result.addClass(that.options.resultClass);

		this.$trigger.trigger("render:chironSearch",that.$result);

		setTimeout(function(){
			var width=that.$trigger.innerWidth();
			that.$result.width(width);
		},300);

		$.each(this.options.selectedData,function(index,item){
			html.push(
				"<span data-field='",
				item.field,
				"' class='chiron-search-result-item'>",
				that.options.formatResult(item.value),
				"<span class='chiron-search-result-remove ",
				that.options.removeIcon,
				"'></span></span>"
			);
		});
	};
	
	html=html.join("");

	this.$result.append(html);

	this.$resultItem=this.$result.find(".chiron-search-result-item");
	this.$resultItem.addClass(that.options.resultItemClass);

	this.$remove=this.$result.find(".chiron-search-result-remove");
	this.$remove.addClass(that.options.removeClass);
	
	if ( that.options.uploadForm ){
			that.uploadForm();
	};

	that.$result.find(".chiron-search-result-remove").off("click").on("click",function(){
		var field=$(this).parent().data("field");

		$.each(that.options.selectedData,function(index,item){
			if (item.field==field){
				deleteIndex=index;
				return;
			};
		});

		var deleteItem=that.options.selectedData[deleteIndex];

		that.options.selectedData.splice(deleteIndex,1);

		that.uploadForm();

		that.$trigger.trigger("update:chironSearch",that.options.selectedData);

		that.$trigger.trigger("delete:chironSearch",deleteItem);

		$(this).parent().remove();
	});
};

// Build form element for submit.
ChironSearch.prototype.uploadForm=function(){
	var that=this,
		html=[],$html,fields=[];

	this.$trigger.siblings("[name='"+this.options.name+"']").remove();

	if ( this.options.uploadForm=="input" ){
		html.push("<input type='hidden' name='"+this.options.name+"'>");
		this.$trigger.parent().append(html.join(""));
		$html=this.$trigger.siblings("[name='"+this.options.name+"']");

		$.each(this.options.selectedData,function(index,item){
				fields.push(item.field);
		});
		fields=fields.join(",");

		$html.val(fields);
	}else{
		html.push("<select name='"+this.options.name+"' multiple='multiple' "+
			"style='position:absolute;opacity:0;filter:Alpha(opacity=0);'>");
		
		$.each(this.options.selectedData,function(index,item){
			html.push("<option value='"+item.field+"' selected>"+item.value+"</option>");
		});

		html.push("</select>");

		this.$trigger.parent().append(html.join(""));
		$html=this.$trigger.siblings("[name='"+this.options.name+"']");
	};

	that.$trigger.trigger("submit:chironSearch",$html);
};


/* Pubilc Method */

// Get selected items of data.
ChironSearch.prototype.getSelectedData=function(){
	return this.options.selectedData;
};

// Render result by origin selected items.
ChironSearch.prototype.reset=function(){
	if ( this.options.originSelected ){
		this.options.selectedData=$.extend([],this.options.originSelected);
		this.destroy();
		this.initResult();
	};
	return this.$trigger;
};

// Clean result.
ChironSearch.prototype.destroy=function(){
	this.$trigger.siblings(".chiron-search-result").remove();
	this.$trigger.siblings("[name='"+this.options.name+"']").remove();

	this.$result.html("");

	return this.$trigger;
};

// Public methods of ChironSearch.Use '$(ele).chironSearch("destroy")' to execute.
var allowedMethods=["getSelectedData","reset","destroy"];

// jQuery Pulgin
$.prototype.chironSearch=function(option){
	if ( this[0].nodeName!= "INPUT" ){
		throw new Error("Supported Element Is Only INPUT.")
	};

	var that=this,
		value,
		args=Array.prototype.slice.call(arguments, 1),
		data=$(this).data("chiron-search"),// ChironSearch instance
		htmlOptions={};

	// Get Html options.
	$.each(ChironSearch.DEFAULTS,function(key){
		htmlOptions[key]=$(that).data()[key];
	});

	// Merge default options,Html options,Js options onto options.
	options=$.extend({},ChironSearch.DEFAULTS,htmlOptions,typeof option==='object' && option);

	// If options's type is string,execute the corresponding method of ChironSearch instance.
	if ( typeof option=="string" ){
			if ( $.inArray(option,allowedMethods)<0 ) {
      		throw new Error("Unknown method: "+option);
    	};

	    if ( !data ){
	      	return;
	    };

    	value=data[option].apply(data, args);

	    if (option==='destroy') {
	      	$(this).removeData('chiron-search');
	    };
	};

	// If the current options is different from the previous options,and options'type is object,
	// then create another ChironSearch instance.
	if ( data && $.type(data)=="object" ){
		if ( !equal(data.originOptions,options) ){
			data.destroy();
			$(this).removeData('chiron-search');
			$(this).data('chiron-search', (data=new ChironSearch(this, options)));
		};
	};

	// If there is no ChironSearch instance,create it.
	if ( !data ){
		$(this).data('chiron-search',(data=new ChironSearch(this, options)));
	};

	// Return dom object or the result of ChironSearch instance method.
	return typeof value=='undefined' ? $(this) : value;
};

// Check objA is equal to objB,return true or false.
function equal(objA,objB){
	if ( $.type(objA) != $.type(objB) ) return false;

	switch($.type(objA)){
		case "string":
			if ( $.type(objB)!="string" && $.type(objB)!="number" ) return false;

			return objA==String(objB);

		case "number":
			if ( $.type(objB)!="string" && $.type(objB)!="number" ) return false;
			return objA==Number(objB);

		case "array":
			if ( $.type(objB)!="array" ) return false;

			if ( objA.length!=objB.length ) return false;

			var isEqual=true;

			$.each(objA,function(index,item){
				if ( !equal(item,objB[index]) ) isEqual=false;
			});

			return isEqual;

		case "function":
			if ( $.type(objB)!="function" ) return false;

			return objA.toString()==objB.toString();

		case "object":
			if ( $.type(objB)!="object" ) return false;

			var isEqual=true;

			$.each(objA,function(key,value){
				if ( objB[key]==undefined ) isEqual=false;
			});

			$.each(objB,function(key,value){
				if ( objA[key]==undefined ) isEqual=false;
			});

			$.each(objA,function(key,value){
				if (!equal(value,objB[key])) isEqual=false;
			});

			return isEqual;
		default:
			return objA==objB;
			break;
	};
};

})(jQuery,window)