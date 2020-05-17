var Calendar = FullCalendar.Calendar;
var Draggable = FullCalendarInteraction.Draggable;
var containerEl = document.getElementById('external-events');

new Draggable(containerEl, {
    itemSelector: '.external-event',
    eventData: function(eventEl) {
        console.log(eventEl);
        return {
            title: eventEl.getAttribute('data-initial'),
            backgroundColor: window.getComputedStyle( eventEl ,null).getPropertyValue('background-color'),
            borderColor: window.getComputedStyle( eventEl ,null).getPropertyValue('background-color'),
            textColor: window.getComputedStyle( eventEl ,null).getPropertyValue('color'),
            allDay: true,
        };
    },
});


/* initialize the external events
   -----------------------------------------------------------------*/
   function ini_events(ele) {
    ele.each(function () {

        // create an Event Object (http://arshaw.com/fullcalendar/docs/event_data/Event_Object/)
        // it doesn't need to have a start or end
        var eventObject = {
            title: $.trim($(this).text()) // use the element's text as the event title
        }

        // store the Event Object in the DOM element so we can get to it later
        $(this).data('eventObject', eventObject)

        // make the event draggable using jQuery UI
        $(this).draggable({
            zIndex        : 1070,
            revert        : true, // will cause the event to go back to its
            revertDuration: 0  //  original position after the drag
        })

    })
}

ini_events($('#external-events div.external-event'))

/* initialize the calendar
 -----------------------------------------------------------------*/
//Date for the calendar events (dummy data)
var date = new Date()
var d    = date.getDate(),
    m    = date.getMonth(),
    y    = date.getFullYear()

document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');

    calendar = new FullCalendar.Calendar(calendarEl, {
        schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
        plugins: [ 'interaction', 'resourceTimeline' ],
        // timeZone: 'UTC',
        defaultView: 'resourceTimelineMonth',
        contentHeight: 'auto',
        droppable: true,
        views: {
            month: {
                columnFormat: 'd' // set format for month here
            },
            week: {
                columnFormat: 'ddd d/M' // set format for week here
            },
            day: {
                columnFormat: 'dddd' // set format for day here
            }
        },
        slotLabelFormat: [
            { month: 'long', year: 'numeric' }, // top level of text
            { day: 'numeric' } // lower level of text
        ],
        slotEventOverlap: false,
        displayEventTime: false,
        aspectRatio: 1.5,
        header: {
            
            left: 'prev,next',
            center: 'title',
            right: 'resourceTimelineMonth'
        },
        editable: true,
        disableDragging:true,
        // disableResizing: true,
        resourceColumns: [
            {
                labelText: 'No',
                width: 18,
                field:'no'
                
            },
            {
                labelText: 'Employee',
                field: 'title',
            }
           
          ],
        resources : 
            function(fetchInfo, successCallback, failureCallback )
        {
            getEmployeeList(function(data) {
                // console.log(data);
                successCallback(data);
            });
        },
        
        events:  function(fetchInfo, successCallback, failureCallback )
        {
            // console.log(fetchInfo);
            getAttendanceList(function(data) {
                // console.log(data);
                successCallback(data);
            },fetchInfo);
        },
        eventDrop: function(info) 
        {
            // if(typeof oldDragEvent !== 'undefined')
            //     oldDragEvent.remove();

            // console.log(info);
            var resourceid = info.event._def.resourceIds[0];
            var attendance = info.event.title;

            var startdate = info.event.start;
            var enddate = info.event.end;

            var prevstartdate  = info.oldEvent.start;
            var prevenddate = info.oldEvent.end;

            $.post(base_url+'/attendance/eventTimeUpdate',{
                driverid:resourceid,
                attendance:attendance,
                start:startdate.getDate() +'-'+parseInt(startdate.getMonth() + 1)+'-'+ startdate.getFullYear(),
                end:enddate.getDate() + '-' + parseInt(enddate.getMonth() + 1) + '-' + enddate.getFullYear(),
                prevstart:prevstartdate.getDate() + '-' + parseInt(prevstartdate.getMonth() + 1) + '-' + prevstartdate.getFullYear(),
                prevend:prevenddate.getDate() + '-' + parseInt(prevenddate.getMonth() + 1) + '-' + prevenddate.getFullYear(),
                event:'drop'
            },function (json,status,xhr) {
                if(xhr.status == 200){
                    // setTimeout(()=>{
                    //     window.location.reload();
                    // },3000)

                    // calendar.refetchEvents();
                }
            },'json');
        },
        eventResize: function(info) 
        {
            if(typeof oldDragEvent !== 'undefined')
                oldDragEvent.remove();

            // console.log(info);

            var resourceid = info.event._def.resourceIds[0];
            var attendance = info.event.title;

            // console.log(info.event);
            // console.log(info.event.start);
            // console.log(info.event.end);

            var startdate = info.event.start;
            var enddate = info.event.end;

            // console.log(info.prevEvent);
            // console.log(info.prevEvent.start);
            // console.log(info.prevEvent.end);

            var prevstartdate  = info.prevEvent.start;
            var prevenddate = info.prevEvent.end;
            var prevend = (info.prevEvent.end != null) ? prevenddate.getDate() + '-' + parseInt(prevenddate.getMonth() + 1) + '-' + prevenddate.getFullYear() : null;

            $.post(base_url+'/attendance/eventTimeUpdate',
            {
                driverid:resourceid,
                attendance:attendance,
                start:startdate.getDate() +'-'+parseInt(startdate.getMonth() + 1)+'-'+ startdate.getFullYear(),
                end:enddate.getDate() + '-' + parseInt(enddate.getMonth() + 1) + '-' + enddate.getFullYear(),
                prevstart:prevstartdate.getDate() + '-' + parseInt(prevstartdate.getMonth() + 1) + '-' + prevstartdate.getFullYear(),
                prevend:prevend,
                event:'resize'
            },function (json,status,xhr) 
            {
                if(xhr.status == 200)
                {
                    // calendar.refetchEvents();
                    // setTimeout(()=>{
                    //     window.location.reload();
                    // },3000)
                }
            },'json');
        },
        eventReceive: function(event, view) 
        {
            // if(typeof oldDragEvent !== 'undefined')
            // {
            //     console.log(oldDragEvent);
            //     oldDragEvent.remove();
            // }
            var resourceid = event.event._def.resourceIds[0];
            var attendance = event.draggedEl.dataset.initialId;
            var initialdate = event.event.start.getDate();
            var initialmonth = parseInt(event.event.start.getMonth()) + 1;
            var initialyear = event.event.start.getFullYear();
            var month_year = moment(event.event.start).format('MM-YYYY');
            var resources = event.event.getResources();
            var driver_name = resources.map(function(resource) { return resource.title });
            // console.log(driver_name);
            $.post(base_url + '/attendance/eventTimeUpdate',
            {
                driverid:resourceid,
                attendance:attendance,
                date:initialdate,
                month:initialmonth,
                year:initialyear,
                month_year:month_year,
                driverName:driver_name[0],
                event:'drag'
            },function(json,status,xhr){
                if(xhr.status == 200)
                {
                    // setTimeout(()=>{
                    //     window.location.reload();
                    // },3000)
                    // calendar.refetchEvents();
                    // resourceid.refetch();
                }
            },'json');
        },
        // eventOverlap : false
        eventOverlap: function(stillEvent, movingEvent) 
        {
            oldDragEvent = stillEvent;
            // stillEvent.remove();
            return true;
            // return stillEvent.allDay && movingEvent.allDay;
        },
        eventResourceEditable: false,
        eventStartEditable:false,
        loading: function( isLoading, view ) {
            if(isLoading) {// isLoading gives boolean value
                $('#calendar').prepend(calendarLoader); 
            } else {
                $('#processing').remove();
            }
        }
    });

    calendar.render();

    var dataQ = calendar.getResources();
    // console.log(dataQ)

    // $('body').on('click', 'button.fc-prev-button', function() {
    //     // alert('PREVIOUS');
    //     calendar.refetchEvents();
    // });

    // $('body').on('click', 'button.fc-next-button', function() {
    //     // alert('NEXT');
    //     calendar.refetchEvents();
    // });
});


function getEmployeeList(data){

    $.ajaxSetup({
        headers: {
          'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        }
    });
    $.ajax({
        url: base_url + '/attendance/getEmployeeList',
        method: 'POST',
        dataType: "json",
        data: {
            employee_id : $('#employee_id').val()
        },
        success: function(response)
        {
            data(response);
        }
    });
}

function getAttendanceList(data,fetchInfo)
{
    $.ajax({
        url: base_url + '/attendance/getAttendanceList',
        method: 'POST',
        dataType: "json",
        data: 
        { 
            monthYear : moment(fetchInfo.start).format('MM-YYYY'),
            employee_id : $('#employee_id').val() 
        },
        success: function(response)
        {
            data(response);
        }
    });
}

