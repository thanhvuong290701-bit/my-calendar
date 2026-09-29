const SUPABASE_URL =
    "https://ctneboruhdpcghddepyj.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_dOTuTnsC1a1h-qUASKYXIg_Qvd28e-d";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


let currentDate = new Date();

let selectedDate = null;

let selectedNote = null;


const monthYear =
    document.getElementById("monthYear");

const calendarDays =
    document.getElementById("calendarDays");

const modal =
    document.getElementById("modal");

const selectedDateElement =
    document.getElementById("selectedDate");

const noteTitle =
    document.getElementById("noteTitle");

const noteContent =
    document.getElementById("noteContent");

const createdBy =
    document.getElementById("createdBy");



async function loadCalendar() {

    calendarDays.innerHTML = "";

    const year =
        currentDate.getFullYear();

    const month =
        currentDate.getMonth();


    const firstDay =
        new Date(year, month, 1);

    const lastDay =
        new Date(year, month + 1, 0);


    const firstDayOfWeek =
        (firstDay.getDay() + 6) % 7;


    const totalDays =
        lastDay.getDate();


    const previousMonthLastDay =
        new Date(year, month, 0).getDate();


    monthYear.textContent =
        currentDate.toLocaleDateString(
            "vi-VN",
            {
                month: "long",
                year: "numeric"
            }
        );


    // Lấy note của tháng hiện tại

    const startDate =
        formatDate(
            new Date(year, month, 1)
        );

    const endDate =
        formatDate(
            new Date(year, month + 1, 0)
        );


    const { data, error } =
        await supabaseClient
            .from("calendar_notes")
            .select("*")
            .gte("event_date", startDate)
            .lte("event_date", endDate);


    if (error) {

        console.error(error);

        alert(
            "Không thể tải dữ liệu Calendar. Kiểm tra Supabase."
        );

        return;
    }


    const notes = data || [];


    // Ngày tháng trước

    for (
        let i = firstDayOfWeek - 1;
        i >= 0;
        i--
    ) {

        const day =
            previousMonthLastDay - i;

        createDay(
            day,
            new Date(year, month - 1, day),
            true,
            []
        );
    }


    // Ngày tháng hiện tại

    for (
        let day = 1;
        day <= totalDays;
        day++
    ) {

        const date =
            new Date(year, month, day);

        const dateString =
            formatDate(date);

        const dayNotes =
            notes.filter(
                n => n.event_date === dateString
            );

        createDay(
            day,
            date,
            false,
            dayNotes
        );
    }


    // Ngày tháng sau

    const totalCells =
        firstDayOfWeek + totalDays;

    const remaining =
        totalCells % 7 === 0
            ? 0
            : 7 - (totalCells % 7);


    for (
        let day = 1;
        day <= remaining;
        day++
    ) {

        createDay(
            day,
            new Date(year, month + 1, day),
            true,
            []
        );
    }
}



function createDay(
    dayNumber,
    date,
    otherMonth,
    notes
) {

    const div =
        document.createElement("div");

    div.className = "day";


    if (otherMonth) {

        div.classList.add(
            "other-month"
        );
    }


    if (isToday(date)) {

        div.classList.add(
            "today"
        );
    }


    const number =
        document.createElement("div");

    number.className =
        "day-number";

    number.textContent =
        dayNumber;


    div.appendChild(number);


    notes.forEach(note => {

        const noteDiv =
            document.createElement("div");

        noteDiv.className =
            "note";


        const title =
    document.createElement("div");

title.className =
    "note-title";

title.textContent =
    "📝 " + note.title;


noteDiv.appendChild(title);


// Hiển thị thời gian cập nhật

const time =
    document.createElement("div");

time.className =
    "note-time";

if (note.updated_at) {

    const updated =
        new Date(note.updated_at);

    time.textContent =
        "🕐 " +
        updated.toLocaleString(
            "vi-VN",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
}

noteDiv.appendChild(time);

div.appendChild(noteDiv);
    });


    div.addEventListener(
        "click",
        () => openModal(date, notes)
    );


    calendarDays.appendChild(div);
}



function openModal(date, notes) {

    selectedDate = formatDate(date);

    selectedNote =
        notes.length > 0
            ? notes[0]
            : null;


    selectedDateElement.textContent =
        date.toLocaleDateString(
            "vi-VN",
            {
                weekday: "long",
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );


    if (selectedNote) {

        noteTitle.value =
            selectedNote.title || "";

        noteContent.value =
            selectedNote.content || "";

        createdBy.value =
            selectedNote.created_by || "";

    } else {

        noteTitle.value = "";

        noteContent.value = "";

        createdBy.value = "";
    }


    modal.classList.add("show");
}



async function saveNote() {

    const title =
        noteTitle.value.trim();

    const content =
        noteContent.value.trim();

    const user =
        createdBy.value.trim();


    if (!title) {

        alert(
            "Bạn chưa nhập tiêu đề."
        );

        return;
    }


    if (selectedNote) {

        const { error } =
            await supabaseClient
                .from("calendar_notes")
                .update({

                    title: title,

                    content: content,

                    created_by: user,

                    updated_at:
                        new Date().toISOString()

                })
                .eq(
                    "id",
                    selectedNote.id
                );


        if (error) {

            console.error(error);

            alert(
                "Không thể cập nhật ghi chú."
            );

            return;
        }

    } else {

        const { error } =
            await supabaseClient
                .from("calendar_notes")
                .insert({

                    event_date:
                        selectedDate,

                    title: title,

                    content: content,

                    created_by: user

                });


        if (error) {

            console.error(error);

            alert(
                "Không thể lưu ghi chú."
            );

            return;
        }
    }


    closeModal();

    loadCalendar();
}



async function deleteNote() {

    if (!selectedNote) {

        closeModal();

        return;
    }


    const confirmDelete =
        confirm(
            "Bạn có chắc muốn xóa ghi chú này?"
        );


    if (!confirmDelete) {

        return;
    }


    const { error } =
        await supabaseClient
            .from("calendar_notes")
            .delete()
            .eq(
                "id",
                selectedNote.id
            );


    if (error) {

        console.error(error);

        alert(
            "Không thể xóa ghi chú."
        );

        return;
    }


    closeModal();

    loadCalendar();
}



function closeModal() {

    modal.classList.remove(
        "show"
    );

    selectedNote = null;
}



function formatDate(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;
}



function isToday(date) {

    const today =
        new Date();


    return (
        date.getFullYear() ===
            today.getFullYear() &&

        date.getMonth() ===
            today.getMonth() &&

        date.getDate() ===
            today.getDate()
    );
}



document
    .getElementById("prevMonth")
    .addEventListener(
        "click",
        () => {

            currentDate =
                new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() - 1,
                    1
                );

            loadCalendar();
        }
    );



document
    .getElementById("nextMonth")
    .addEventListener(
        "click",
        () => {

            currentDate =
                new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() + 1,
                    1
                );

            loadCalendar();
        }
    );



document
    .getElementById("todayBtn")
    .addEventListener(
        "click",
        () => {

            currentDate =
                new Date();

            loadCalendar();
        }
    );



document
    .getElementById("saveBtn")
    .addEventListener(
        "click",
        saveNote
    );



document
    .getElementById("deleteBtn")
    .addEventListener(
        "click",
        deleteNote
    );



document
    .getElementById("closeModal")
    .addEventListener(
        "click",
        closeModal
    );



document
    .getElementById("cancelBtn")
    .addEventListener(
        "click",
        closeModal
    );



modal.addEventListener(
    "click",
    event => {

        if (
            event.target === modal
        ) {

            closeModal();
        }
    }
);


// Khởi động Calendar

loadCalendar();