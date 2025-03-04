window.init_volunteer_schedule = (data, all_roles, active_day, is_admin) => {
    var current_day = active_day;

    function render(){
        var filters = get_filters(),
            days_data = data[current_day],
            day_ele = $('#tbody-'+current_day);

        day_ele.empty();

        $.each(days_data, function(hour, hours_shifts) {
            var n_shifts = hours_shifts.length,
                rows = [];

            $.each(hours_shifts, function(index, shift) {
                if (fails_filters(filters, shift)) {
                    return;
                }
                rows.push(make_row(shift));
            });

            if (rows.length > 0) {
                prepend_hour_cell(rows[0], hour, rows.length);
                day_ele.append(rows);
            }
        });

        save_filters();
    }

    function prepend_hour_cell(row, hour, rowspan) {
        var cell = make_cell(hour);
        cell.attr('rowspan', rowspan);
        row.prepend(cell);
        return row;
    }

    function make_row(shift) {
        var row_ele = $(document.createElement('tr'));
        const cells = [
                make_cell(shift.end_time),
                make_cell(shift.venue.name),
                make_cell(shift.role.name),
                make_cell(shift.current_count + '/' + shift.max_needed),
                make_cell(make_details_button(shift))
            ];

        row_ele.append(cells);
        row_ele.addClass(row_class(shift));
        row_ele.attr('id', 'shift-'+shift.id);
        row_ele.click(make_open_modal_fn(shift));
        return row_ele;
    }

    function row_class(shift) {
        if (!$('#colourful_mode').prop('checked')) {
            return;
        }

        if (shift.min_needed == shift.max_needed) {
            return shift.current_count < shift.min_needed ? 'danger' : 'info';
        }

        if (shift.current_count < shift.min_needed) {
            return 'danger';
        }
        if (shift.current_count == shift.max_needed) {
            return 'info';
        }

        return 'warning';
    }

    function make_cell(inner) {
        return make_ele('td', inner);
    }

    function make_details_button(shift) {
        var content = shift.is_user_shift ? 'Cancel' : 'Sign Up';
        var cls = shift.is_user_shift ? 'btn-danger' : 'btn-success';

        return `<button id="shift-signup-${shift.id}" class="btn btn-block ${cls}">${content}</button>`;
    }

    function make_open_modal_fn(shift) {
        return function open_modal() {
            $('#modal-role').html(shift.role.name);
            $('#modal-time').html(shift.start_time);

            $('#modal-start-time').html(shift.start_time);
            $('#modal-end-time').html(shift.end_time);
            $('#modal-location').html(shift.venue.name);

            var role_id = shift.role.name.toLowerCase().replace(/[^\w]+/g, '-');
            $('#modal-description').html($(`#role-description-${role_id}`).clone().show());

            $('#signUp #signup-grp').empty();
            $('#signUp #signup-grp').append(make_modal_buttons(shift));


            if (is_admin) {
                var override_btn = $('#signUp #override-sign-up-btn');
                override_btn.click(make_override_signup_fn(override_btn, shift));
                $('#contact-link').attr('href', 'shift/'+shift.id+'/contact');
                $('#shift-link').attr('href', 'shift/'+shift.id);
            }

            $('#signUp').modal();
        };
    }

    function make_modal_buttons(shift) {
        var close_btn = make_button('default', 'Close'),
            submit_btn = make_button('primary', (shift.is_user_shift) ? 'Cancel shift': 'Sign up');

        close_btn.attr('data-dismiss', 'modal');
        submit_btn.attr('id', 'sign-up-'+shift.id);
        submit_btn.addClass('debouce');
        submit_btn.click(make_sign_up_fn(submit_btn, shift));

        return [close_btn, submit_btn];
    }

    function make_button(btn_class, inner) {
        var btn = make_ele('btn', inner);
        btn.addClass('btn btn-'+btn_class);
        btn.attr('type', 'button');
        return $(btn);
    }

    function make_sign_up_fn(ele, shift) {
        return function (){
            var modal_body = $('#signUp .modal-body');
            ele.attr('disabled', true);

            $.post(shift.sign_up_url+'.json')
             .done(make_post_callback_fn(modal_body, ele, shift.id, "alert-info"))
             .fail(make_post_callback_fn(modal_body, ele, shift.id, "alert-danger"));
        };
    }

    function make_override_signup_fn(btn_ele, shift) {
        return function () {
            var override_user = $('#override-user').val(),
                modal_body = $('#signUp .modal-body');

            btn_ele.attr('disabled', true);

            $.post(shift.sign_up_url + '.json?override_user=' + override_user)
             .done(make_post_callback_fn(modal_body, btn_ele, shift.id, "alert-info", true))
             .fail(make_post_callback_fn(modal_body, btn_ele, shift.id, "alert-danger", true));
        };
    }

    function make_post_callback_fn(append_ele, btn_ele, shift_id, alert_type, override_user) {
        return function(resp) {
            var main_msg = (override_user ? resp.user: '') + resp.message,
                alert = make_alert(alert_type, main_msg);
            append_ele.prepend(alert);

            if (resp.warning) {
                alert = make_alert('alert-warning', resp.warning);
                append_ele.prepend(alert);
            }

            var shift = get_shift(shift_id);
            if (resp.operation == 'add') {
                shift.current_count++;
                if (!override_user) {
                    shift.is_user_shift = true;
                }
            } else if (resp.operation == 'delete') {
                shift.current_count--;
                if (!override_user) {
                    shift.is_user_shift = false;
                }
            }
            update_shift(shift_id, shift);
            $('#signUp #signup-grp').empty();
            $('#signUp #signup-grp').append(make_modal_buttons(shift));
        };
    }

    function make_alert(alert_type, msg) {
        var alert = $(document.createElement('div'));
        alert.addClass('alert alert-dismissible fade in '+alert_type);
        alert.attr('role', 'alert');
        // Dismiss button must be the first child
        alert.html('<button type="button" class="close" data-dismiss="alert" aria-label="Close">'+
                        '<span aria-hidden="true">×</span>'+
                    '</button>'+
                    msg);
        return $(alert);
    }

    function make_ele(type, inner) {
        var new_ele = document.createElement(type);
        new_ele.innerHTML = inner;
        return $(new_ele);
    }

    function get_shift(shift_id) {
        var res;
        $.each(data, function(_, day) {
            $.each(day, function(_, hour) {
                $.each(hour, function(_, shift) {
                    if (shift_id === shift.id) {
                        res = shift;
                    }
                });
            });
        });
        return res;
    }

    function update_shift(shift_id, shift) {
        var day_index, hour_index, arr_index;
        $.each(data, function(day, day_shifts) {
            $.each(day_shifts, function(hour, hour_shifts) {
                $.each(hour_shifts, function(index, shift) {
                    if (shift_id === shift.id) {
                        day_index = day;
                        hour_index = hour;
                        arr_index = index;
                    }
                });
            });
        });
        data[day_index][hour_index][arr_index] = shift;
    }

    function fails_filters(filters, shift) {
        let role_ids = filters.role_ids.map(id => parseInt(id));
        if (role_ids.length > 0 && role_ids.indexOf(shift.role_id) == -1) {
            return true;
        }

        let venue_ids = filters.venue_ids.map(id => parseInt(id));
        if (venue_ids.length > 0 && venue_ids.indexOf(shift.venue_id) == -1) {
            return true;
        }

        if (!filters.show_past && new Date(shift.end) < new Date()) {
            return true;
        }

        if (filters.show_signed_up_only && !shift.is_user_shift) {
            return true;
        }

        if (filters.hide_full && shift.current_count == shift.max_needed) {
            return true;
        }

        if (filters.understaffed_only && shift.current_count >= shift.min_needed) {
            return true;
        }

        return false;
    }

    function get_filters() {
        var show_past = $('#show_past').prop('checked'),
            show_signed_up_only = $('#show_signed_up_only').prop('checked'),
            hide_full = $('#hide_full').prop('checked'),
            understaffed_only = $('#is_understaffed').prop('checked'),
            role_ids = $('#role-select').val() || [],
            venue_ids = $('#venue-select').val() || [];

        return {
            role_ids: role_ids,
            venue_ids: venue_ids,
            show_past: show_past,
            hide_full: hide_full,
            understaffed_only: understaffed_only,
            show_signed_up_only: show_signed_up_only,
        };
    }

    function set_roles() {
        var is_interested = $('#is_interested').prop('checked'),
            is_trained = $('#is_trained').prop('checked');

        $.each(all_roles, function(_, role) {
            let selected = true;

            if (is_interested && !role.is_interested) {
                selected = false;
            }

            if (is_trained && (role.requires_training && !role.is_trained)) {
                selected = false;
            }

            $('#role-opt-'+role.id).prop('selected', selected);
        });

        render();
    }

    function clear_filters() {
        $('#role-select > option').each(function(_, ele) {
            $(ele).attr('selected', false);
        });
        $('#venue-select > option').each(function(_, ele) {
            $(ele).attr('selected', false);
        });
        $('#show_past').prop('checked', false);
        $('#hide_full').prop('checked', false);
        $('#show_signed_up_only').prop('checked', false);
        $('#is_interested').prop('checked', false);
        $('#is_trained').prop('checked', false);
        $('#is_understaffed').prop('checked', false);
        $('#colourful_mode').prop('checked', false);
        render();
    }

    function save_filters() {
        let filters = {
            role_ids: $('#role-select').val(),
            venue_ids: $('#venue-select').val(),
            show_past: $('#show_past').prop('checked'),
            hide_full: $('#hide_full').prop('checked'),
            show_signed_up_only: $('#show_signed_up_only').prop('checked'),
            is_trained: $('#is_trained').prop('checked'),
            is_interested: $('#is_interested').prop('checked'),
            is_understaffed: $('#is_understaffed').prop('checked'),
            colourful_mode: $('#colourful_mode').prop('checked'),
        }

        localStorage.setItem('volunteer-filters:v1', JSON.stringify(filters));
    }

    function load_filters() {
        let raw_saved_filters = localStorage.getItem('volunteer-filters:v1');
        if (raw_saved_filters == null) { return; }
        let filters = JSON.parse(raw_saved_filters);

        $('#role-select').val(filters.role_ids);
        $('#venue-select').val(filters.venue_ids);
        $('#show_past').prop('checked', filters.show_past);
        $('#hide_full').prop('checked', filters.hide_full);
        $('#show_signed_up_only').prop('checked', filters.show_signed_up_only);
        $('#is_interested').prop('checked', filters.is_interested);
        $('#is_trained').prop('checked', filters.is_trained);
        $('#is_understaffed').prop('checked', filters.is_understaffed);
        $('#colourful_mode').prop('checked', filters.colourful_mode);
    }

    // When explicitly selecting roles turn off the filters that would override
    // that selection.
    function roles_selected() {
        $('#is_interested').prop('checked', false);
        $('#is_trained').prop('checked', false);
    }

    function venues_selected() {
        // Don't do anything currently
    }


    ////////////////////////////////////
    //
    //
    // Set up events
    //
    ////////////////////////////////////

    // On tab change
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        current_day = $(e.target).attr('data-day');
        render();

        // Clear the old stuff
        var prev_day = $(e.relatedTarget).attr('data-day');
        $('#tbody-'+prev_day).empty();
    });

    // Filter buttons
    $('#clear-btn').click(clear_filters);

    $('#signUp').on('hide.bs.modal', render);
    $('#is_interested').prop('checked', true);
    load_filters();
    set_roles();
    render();

    let searchParams = new URLSearchParams(window.location.search);
    if(searchParams.has('signedup')){
        $('#show_signed_up_only').prop('checked', true);
        render();
    } else {
        $('#show_signed_up_only').prop('checked', false);
        render();
    }

    $('#role-select').on('change', roles_selected);
    $('#venue-select').on('change', venues_selected);
    $('.shift-filter').on('change', render);
    $('.role-filter').on('change', set_roles);
};
