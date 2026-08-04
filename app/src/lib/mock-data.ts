import type {
  Profile, Collection, Book, Chapter, Hadith, Recording,
  WordDefinition, TakhrijReference, Report, ContentReport, AppSettings,
} from "./types";

// ============================================================================
// بيانات وهمية (Mock) — تُستبدل كلياً عند الربط بـ Supabase.
// النصوص من أحاديث مشهورة متواترة (ملكية عامة). لا مصدر خارجي مُرخّص مُستخدم.
// ============================================================================

export const MOCK_SETTINGS: AppSettings = {
  active_users_window_days: 30,
  community_best_min_likes: 3,
  listen_count_threshold_seconds: 5,
  rate_limit_uploads_per_hour: 5,
  report_alert_min: 2,
  report_alert_ratio: 0.15,
  report_hide_min: 4,
  report_hide_ratio: 0.4,
  upload_enabled: true,
};

export const CURRENT_USER_ID = "u-001";
export const ADMIN_USER_ID = "u-000";

export const MOCK_PROFILES: Profile[] = [
  { id: ADMIN_USER_ID, display_name: "الأستاذ عبد الرحمن", role: "admin", consent_given_at: "2026-07-01T08:00:00Z", last_active_at: "2026-08-04T06:00:00Z" },
  { id: "u-001", display_name: "عبدالله الأنصاري", role: "student", consent_given_at: "2026-07-02T08:00:00Z", last_active_at: "2026-08-04T05:00:00Z" },
  { id: "u-002", display_name: "محمد فوزي", role: "student", consent_given_at: "2026-07-02T09:00:00Z", last_active_at: "2026-08-03T05:00:00Z" },
  { id: "u-003", display_name: "أحمد رزقي", role: "student", consent_given_at: "2026-07-03T10:00:00Z", last_active_at: "2026-08-02T05:00:00Z" },
  { id: "u-004", display_name: "يوسف حبيبي", role: "student", consent_given_at: "2026-07-04T10:00:00Z", last_active_at: "2026-08-01T05:00:00Z" },
  { id: "u-005", display_name: "إلياس نور", role: "student", consent_given_at: null, last_active_at: "2026-07-20T05:00:00Z" },
];

export const MOCK_COLLECTIONS: Collection[] = [
  { id: 1, slug: "bukhari", name_ar: "صحيح البخاري", name_id: "Shahih Bukhari", sort_order: 1 },
  { id: 2, slug: "muslim", name_ar: "صحيح مسلم", name_id: "Shahih Muslim", sort_order: 2 },
  { id: 3, slug: "nawawi40", name_ar: "الأربعون النووية", name_id: "Arbain Nawawi", sort_order: 3 },
];

export const MOCK_BOOKS: Book[] = [
  { id: 1, collection_id: 1, name_ar: "كتاب بدء الوحي", name_id: "Kitab Permulaan Wahyu", sort_order: 1 },
  { id: 2, collection_id: 1, name_ar: "كتاب الإيمان", name_id: "Kitab Iman", sort_order: 2 },
  { id: 3, collection_id: 1, name_ar: "كتاب العلم", name_id: "Kitab Ilmu", sort_order: 3 },
  { id: 4, collection_id: 2, name_ar: "كتاب الإيمان", name_id: "Kitab Iman", sort_order: 1 },
  { id: 5, collection_id: 2, name_ar: "كتاب البر والصلة", name_id: "Kitab Berbakti", sort_order: 2 },
  { id: 6, collection_id: 3, name_ar: "الأحاديث الأربعون", name_id: "Empat Puluh Hadits", sort_order: 1 },
];

export const MOCK_CHAPTERS: Chapter[] = [
  { id: 1, book_id: 1, name_ar: "باب كيف كان بدء الوحي", name_id: null, sort_order: 1 },
  { id: 2, book_id: 2, name_ar: "باب أمور الإيمان", name_id: null, sort_order: 1 },
  { id: 3, book_id: 2, name_ar: "باب المسلم من سلم المسلمون من لسانه ويده", name_id: null, sort_order: 2 },
  { id: 4, book_id: 3, name_ar: "باب فضل العلم", name_id: null, sort_order: 1 },
  { id: 5, book_id: 4, name_ar: "باب بيان الإيمان والإسلام والإحسان", name_id: null, sort_order: 1 },
  { id: 6, book_id: 5, name_ar: "باب فضل الرفق", name_id: null, sort_order: 1 },
  { id: 7, book_id: 6, name_ar: "باب النية", name_id: null, sort_order: 1 },
];

export const MOCK_HADITHS: Hadith[] = [
  {
    id: "h-001", chapter_id: 1, hadith_number: 1,
    isnad_ar: "حَدَّثَنَا الحُمَيْدِيُّ عَبْدُ اللَّهِ بْنُ الزُّبَيْرِ، قَالَ: حَدَّثَنَا سُفْيَانُ، قَالَ: حَدَّثَنَا يَحْيَى بْنُ سَعِيدٍ الأَنْصَارِيُّ، قَالَ: أَخْبَرَنِي مُحَمَّدُ بْنُ إِبْرَاهِيمَ التَّيْمِيُّ، أَنَّهُ سَمِعَ عَلْقَمَةَ بْنَ وَقَّاصٍ اللَّيْثِيَّ يَقُولُ: سَمِعْتُ عُمَرَ بْنَ الخَطَّابِ رَضِيَ اللَّهُ عَنْهُ عَلَى المِنْبَرِ قَالَ: سَمِعْتُ رَسُولَ اللَّهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ يَقُولُ:",
    matn_ar: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى دُنْيَا يُصِيبُهَا أَوْ إِلَى امْرَأَةٍ يَنْكِحُهَا فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ",
    translation_id: "Sesungguhnya setiap amalan tergantung pada niatnya, dan setiap orang akan mendapatkan apa yang ia niatkan. Barangsiapa yang hijrahnya karena dunia yang ingin ia raih atau karena wanita yang ingin ia nikahi, maka hijrahnya sesuai dengan apa yang ia niatkan.",
    grade: "sahih",
    explanation_ar: "هذا الحديث أصلٌ عظيم من أصول الدين، وقد قال العلماء إنه ثلث العلم. ومعناه أن صحة العمل وفساده وقبوله وردَّه بحسب النية الباعثة عليه. فالعمل الواحد قد يكون عبادةً وقد يكون عادة، والفارق بينهما النية.",
    length_class: "long", source_api: "mock",
  },
  {
    id: "h-002", chapter_id: 2, hadith_number: 8,
    isnad_ar: "حَدَّثَنَا عَبْدُ اللَّهِ بْنُ مُحَمَّدٍ، قَالَ: حَدَّثَنَا أَبُو عَامِرٍ العَقَدِيُّ، عَنْ سُلَيْمَانَ بْنِ بِلَالٍ، عَنْ عَبْدِ اللَّهِ بْنِ دِينَارٍ، عَنْ أَبِي صَالِحٍ، عَنْ أَبِي هُرَيْرَةَ رَضِيَ اللَّهُ عَنْهُ، عَنِ النَّبِيِّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ قَالَ:",
    matn_ar: "الإِيمَانُ بِضْعٌ وَسِتُّونَ شُعْبَةً، وَالحَيَاءُ شُعْبَةٌ مِنَ الإِيمَانِ",
    translation_id: "Iman itu ada enam puluh sekian cabang, dan malu adalah salah satu cabang dari iman.",
    grade: "sahih",
    explanation_ar: "دلَّ الحديث على أن الإيمان يزيد وينقص، وأنه شُعَبٌ متعددة أعلاها التوحيد وأدناها إماطة الأذى عن الطريق، وأن الحياء خُلُقٌ يبعث على فعل الجميل وترك القبيح.",
    length_class: "short", source_api: "mock",
  },
  {
    id: "h-003", chapter_id: 3, hadith_number: 10,
    isnad_ar: "حَدَّثَنَا آدَمُ بْنُ أَبِي إِيَاسٍ، قَالَ: حَدَّثَنَا شُعْبَةُ، عَنْ عَبْدِ اللَّهِ بْنِ أَبِي السَّفَرِ، وَإِسْمَاعِيلَ، عَنِ الشَّعْبِيِّ، عَنْ عَبْدِ اللَّهِ بْنِ عَمْرٍو رَضِيَ اللَّهُ عَنْهُمَا، عَنِ النَّبِيِّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ قَالَ:",
    matn_ar: "المُسْلِمُ مَنْ سَلِمَ المُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ، وَالمُهَاجِرُ مَنْ هَجَرَ مَا نَهَى اللَّهُ عَنْهُ",
    translation_id: "Seorang muslim adalah orang yang kaum muslimin selamat dari lisan dan tangannya, dan seorang muhajir adalah orang yang meninggalkan apa yang dilarang Allah.",
    grade: "sahih",
    explanation_ar: "بيَّن النبي صلى الله عليه وسلم أن كمال الإسلام في كفِّ الأذى عن المسلمين قولاً وفعلاً، وأن حقيقة الهجرة هجرُ المعاصي لا مجردُ الانتقال من بلد إلى بلد.",
    length_class: "short", source_api: "mock",
  },
  {
    id: "h-004", chapter_id: 4, hadith_number: 71,
    isnad_ar: "حَدَّثَنَا سَعِيدُ بْنُ عُفَيْرٍ، قَالَ: حَدَّثَنَا ابْنُ وَهْبٍ، عَنْ يُونُسَ، عَنِ ابْنِ شِهَابٍ، عَنْ حُمَيْدِ بْنِ عَبْدِ الرَّحْمَنِ، سَمِعْتُ مُعَاوِيَةَ خَطِيبًا يَقُولُ: سَمِعْتُ النَّبِيَّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ يَقُولُ:",
    matn_ar: "مَنْ يُرِدِ اللَّهُ بِهِ خَيْرًا يُفَقِّهْهُ فِي الدِّينِ، وَإِنَّمَا أَنَا قَاسِمٌ وَاللَّهُ يُعْطِي",
    translation_id: "Barangsiapa yang Allah kehendaki kebaikan padanya, niscaya Allah pahamkan ia dalam urusan agama. Sesungguhnya aku hanyalah pembagi, dan Allah-lah yang memberi.",
    grade: "sahih",
    explanation_ar: "فيه فضل الفقه في الدين وأنه علامة إرادة الله بالعبد الخير، وأن النبي صلى الله عليه وسلم مبلِّغٌ عن ربه والتوفيق بيد الله وحده.",
    length_class: "short", source_api: "mock",
  },
  {
    id: "h-005", chapter_id: 6, hadith_number: 2593,
    isnad_ar: "حَدَّثَنَا يَحْيَى بْنُ يَحْيَى التَّمِيمِيُّ، أَخْبَرَنَا عَبْدُ الْعَزِيزِ بْنُ أَبِي حَازِمٍ، عَنْ أَبِيهِ، عَنْ عَائِشَةَ رَضِيَ اللَّهُ عَنْهَا، عَنِ النَّبِيِّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ قَالَ:",
    matn_ar: "إِنَّ الرِّفْقَ لَا يَكُونُ فِي شَيْءٍ إِلَّا زَانَهُ، وَلَا يُنْزَعُ مِنْ شَيْءٍ إِلَّا شَانَهُ",
    translation_id: "Sesungguhnya kelembutan tidaklah ada pada sesuatu melainkan ia akan menghiasinya, dan tidaklah dicabut dari sesuatu melainkan ia akan memperburuknya.",
    grade: "sahih",
    explanation_ar: "حثٌّ على الرفق في الأمور كلها، وبيان أنه سببٌ للزينة والجمال في القول والعمل، وأن العنف سببٌ للشين والقبح.",
    length_class: "short", source_api: "mock",
  },
  {
    id: "h-006", chapter_id: 5, hadith_number: 8,
    isnad_ar: "حَدَّثَنَا أَبُو خَيْثَمَةَ زُهَيْرُ بْنُ حَرْبٍ، حَدَّثَنَا وَكِيعٌ، عَنْ كَهْمَسٍ، عَنْ عَبْدِ اللَّهِ بْنِ بُرَيْدَةَ، عَنْ يَحْيَى بْنِ يَعْمَرَ، عَنْ عُمَرَ بْنِ الْخَطَّابِ رَضِيَ اللَّهُ عَنْهُ قَالَ:",
    matn_ar: "أَنْ تَعْبُدَ اللَّهَ كَأَنَّكَ تَرَاهُ، فَإِنْ لَمْ تَكُنْ تَرَاهُ فَإِنَّهُ يَرَاكَ",
    translation_id: "Engkau beribadah kepada Allah seakan-akan engkau melihat-Nya. Jika engkau tidak melihat-Nya, maka sesungguhnya Dia melihatmu.",
    grade: "sahih",
    explanation_ar: "هذا تعريف الإحسان، وهو أعلى مراتب الدين. ومعناه استحضار مراقبة الله في كل عمل، فمن استشعر ذلك أخلص وأتقن.",
    length_class: "short", source_api: "mock",
  },
  {
    id: "h-007", chapter_id: 7, hadith_number: 1,
    isnad_ar: "عَنْ أَمِيرِ الْمُؤْمِنِينَ أَبِي حَفْصٍ عُمَرَ بْنِ الْخَطَّابِ رَضِيَ اللَّهُ عَنْهُ قَالَ: سَمِعْتُ رَسُولَ اللَّهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ يَقُولُ:",
    matn_ar: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
    translation_id: "Sesungguhnya setiap amalan tergantung pada niatnya, dan setiap orang akan mendapatkan apa yang ia niatkan.",
    grade: "sahih",
    explanation_ar: "افتتح النووي رحمه الله أربعينه بهذا الحديث تنبيهاً على أن كل عملٍ لا يُراد به وجه الله فهو باطل لا ثمرة له في الدنيا ولا في الآخرة.",
    length_class: "short", source_api: "mock",
  },
  {
    id: "h-008", chapter_id: 2, hadith_number: 9,
    isnad_ar: "حَدَّثَنَا مُسَدَّدٌ، قَالَ: حَدَّثَنَا يَحْيَى، عَنْ شُعْبَةَ، عَنْ قَتَادَةَ، عَنْ أَنَسٍ رَضِيَ اللَّهُ عَنْهُ، عَنِ النَّبِيِّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ قَالَ:",
    matn_ar: "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
    translation_id: "Tidak sempurna iman salah seorang di antara kalian hingga ia mencintai untuk saudaranya apa yang ia cintai untuk dirinya sendiri.",
    grade: "sahih",
    explanation_ar: "نفيُ الإيمان هنا نفيٌ للكمال لا لأصله. والمراد أن يحب لأخيه المسلم من الخير مثل ما يحب لنفسه، وهو أصلٌ في سلامة الصدر.",
    length_class: "short", source_api: "mock",
  },
];

export const MOCK_WORD_DEFINITIONS: WordDefinition[] = [
  { id: "w-1", hadith_id: "h-001", word: "النِّيَّاتِ", meaning_ar: "جمع نيّة، وهي القصد المقترن بالفعل. ومحلها القلب.", meaning_id: "Niat: maksud yang menyertai perbuatan, tempatnya di hati." },
  { id: "w-2", hadith_id: "h-001", word: "هِجْرَتُهُ", meaning_ar: "الانتقال من دار الكفر إلى دار الإسلام، وتُطلق على ترك المعاصي.", meaning_id: "Hijrah: berpindah dari negeri kufur ke negeri Islam." },
  { id: "w-3", hadith_id: "h-002", word: "بِضْعٌ", meaning_ar: "العدد من الثلاثة إلى التسعة.", meaning_id: "Bidh'un: bilangan antara tiga sampai sembilan." },
  { id: "w-4", hadith_id: "h-002", word: "شُعْبَةً", meaning_ar: "خصلة وقطعة من الشيء؛ أي جزء من أجزاء الإيمان.", meaning_id: "Cabang atau bagian dari sesuatu." },
  { id: "w-5", hadith_id: "h-003", word: "المُهَاجِرُ", meaning_ar: "التارك لبلده، والمراد هنا التارك للمنهيات.", meaning_id: "Muhajir: orang yang meninggalkan (larangan Allah)." },
  { id: "w-6", hadith_id: "h-004", word: "يُفَقِّهْهُ", meaning_ar: "يجعله فقيهاً عالماً بأحكام الدين وأسرارها.", meaning_id: "Menjadikannya faqih/paham dalam agama." },
  { id: "w-7", hadith_id: "h-005", word: "زَانَهُ", meaning_ar: "زيَّنه وحسَّنه.", meaning_id: "Menghiasi dan memperindahnya." },
  { id: "w-8", hadith_id: "h-005", word: "شَانَهُ", meaning_ar: "عابه وقبَّحه.", meaning_id: "Memperburuk dan mencacatinya." },
];

export const MOCK_TAKHRIJ: TakhrijReference[] = [
  { id: "t-1", hadith_id: "h-001", source_name: "صحيح البخاري", reference_text: "كتاب بدء الوحي، باب كيف كان بدء الوحي، رقم 1" },
  { id: "t-2", hadith_id: "h-001", source_name: "صحيح مسلم", reference_text: "كتاب الإمارة، باب قوله إنما الأعمال بالنية، رقم 1907" },
  { id: "t-3", hadith_id: "h-002", source_name: "صحيح البخاري", reference_text: "كتاب الإيمان، رقم 9" },
  { id: "t-4", hadith_id: "h-002", source_name: "صحيح مسلم", reference_text: "كتاب الإيمان، رقم 35" },
  { id: "t-5", hadith_id: "h-003", source_name: "صحيح البخاري", reference_text: "كتاب الإيمان، رقم 10" },
  { id: "t-6", hadith_id: "h-004", source_name: "صحيح البخاري", reference_text: "كتاب العلم، رقم 71" },
  { id: "t-7", hadith_id: "h-005", source_name: "صحيح مسلم", reference_text: "كتاب البر والصلة، رقم 2594" },
  { id: "t-8", hadith_id: "h-006", source_name: "صحيح مسلم", reference_text: "كتاب الإيمان، رقم 8" },
  { id: "t-9", hadith_id: "h-008", source_name: "صحيح البخاري", reference_text: "كتاب الإيمان، رقم 13" },
];

const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400_000).toISOString();

export const MOCK_RECORDINGS: Recording[] = [
  { id: "r-01", hadith_id: "h-001", user_id: "u-002", file_path: "mock-audio/tone-1.wav", duration_seconds: 12, file_size_bytes: 129_000, codec: "opus", bitrate_kbps: 32, likes_count: 7, listens_count: 41, is_verified: true,  is_hidden: false, verified_by: ADMIN_USER_ID, created_at: d(12) },
  { id: "r-02", hadith_id: "h-001", user_id: "u-003", file_path: "mock-audio/tone-2.wav", duration_seconds: 10, file_size_bytes: 108_000, codec: "opus", bitrate_kbps: 32, likes_count: 4, listens_count: 27, is_verified: false, is_hidden: false, verified_by: null, created_at: d(9) },
  { id: "r-03", hadith_id: "h-001", user_id: "u-004", file_path: "mock-audio/tone-3.wav", duration_seconds: 14, file_size_bytes: 151_000, codec: "opus", bitrate_kbps: 32, likes_count: 1, listens_count: 9,  is_verified: false, is_hidden: false, verified_by: null, created_at: d(4) },
  { id: "r-04", hadith_id: "h-002", user_id: "u-002", file_path: "mock-audio/tone-2.wav", duration_seconds: 8,  file_size_bytes: 86_000,  codec: "opus", bitrate_kbps: 32, likes_count: 5, listens_count: 33, is_verified: false, is_hidden: false, verified_by: null, created_at: d(7) },
  { id: "r-05", hadith_id: "h-002", user_id: "u-004", file_path: "mock-audio/tone-1.wav", duration_seconds: 9,  file_size_bytes: 97_000,  codec: "opus", bitrate_kbps: 32, likes_count: 2, listens_count: 15, is_verified: false, is_hidden: false, verified_by: null, created_at: d(3) },
  { id: "r-06", hadith_id: "h-003", user_id: "u-003", file_path: "mock-audio/tone-3.wav", duration_seconds: 7,  file_size_bytes: 75_000,  codec: "opus", bitrate_kbps: 32, likes_count: 3, listens_count: 22, is_verified: true,  is_hidden: false, verified_by: ADMIN_USER_ID, created_at: d(6) },
  { id: "r-07", hadith_id: "h-003", user_id: "u-005", file_path: "mock-audio/tone-1.wav", duration_seconds: 6,  file_size_bytes: 64_000,  codec: "opus", bitrate_kbps: 32, likes_count: 0, listens_count: 3,  is_verified: false, is_hidden: true,  verified_by: null, created_at: d(2) },
  { id: "r-08", hadith_id: "h-004", user_id: "u-002", file_path: "mock-audio/tone-2.wav", duration_seconds: 8,  file_size_bytes: 86_000,  codec: "opus", bitrate_kbps: 32, likes_count: 6, listens_count: 30, is_verified: false, is_hidden: false, verified_by: null, created_at: d(5) },
  { id: "r-09", hadith_id: "h-005", user_id: "u-003", file_path: "mock-audio/tone-3.wav", duration_seconds: 9,  file_size_bytes: 97_000,  codec: "opus", bitrate_kbps: 32, likes_count: 2, listens_count: 11, is_verified: false, is_hidden: false, verified_by: null, created_at: d(8) },
  { id: "r-10", hadith_id: "h-007", user_id: "u-004", file_path: "mock-audio/tone-1.wav", duration_seconds: 7,  file_size_bytes: 75_000,  codec: "opus", bitrate_kbps: 32, likes_count: 8, listens_count: 52, is_verified: false, is_hidden: false, verified_by: null, created_at: d(10) },
  { id: "r-11", hadith_id: "h-008", user_id: "u-002", file_path: "mock-audio/tone-2.wav", duration_seconds: 6,  file_size_bytes: 64_000,  codec: "opus", bitrate_kbps: 32, likes_count: 1, listens_count: 6,  is_verified: false, is_hidden: false, verified_by: null, created_at: d(1) },
  { id: "r-12", hadith_id: "h-006", user_id: CURRENT_USER_ID, file_path: "mock-audio/tone-3.wav", duration_seconds: 11, file_size_bytes: 118_000, codec: "opus", bitrate_kbps: 32, likes_count: 3, listens_count: 18, is_verified: false, is_hidden: false, verified_by: null, created_at: d(2) },
];

export const MOCK_LIKES: { recording_id: string; user_id: string }[] = [
  { recording_id: "r-01", user_id: CURRENT_USER_ID },
  { recording_id: "r-10", user_id: CURRENT_USER_ID },
];
export const MOCK_FAVORITES: { recording_id: string; user_id: string }[] = [
  { recording_id: "r-02", user_id: CURRENT_USER_ID },
];

export const MOCK_REPORTS: Report[] = [
  { id: "rep-1", recording_id: "r-07", reporter_id: "u-002", reason: "poor_quality", note: "التسجيل فيه ضجيج شديد وغير مفهوم.", status: "open", created_at: d(2) },
  { id: "rep-2", recording_id: "r-07", reporter_id: "u-003", reason: "incorrect_recitation", note: "خطأ في تشكيل كلمة «سَلِمَ».", status: "open", created_at: d(2) },
  { id: "rep-3", recording_id: "r-07", reporter_id: "u-004", reason: "poor_quality", note: null, status: "open", created_at: d(1) },
  { id: "rep-4", recording_id: "r-07", reporter_id: ADMIN_USER_ID, reason: "other", note: "مراجعة إدارية.", status: "open", created_at: d(1) },
  { id: "rep-5", recording_id: "r-03", reporter_id: "u-002", reason: "incorrect_recitation", note: "قرأ «امرَأة» بفتح الراء والصواب الكسر.", status: "open", created_at: d(3) },
  { id: "rep-6", recording_id: "r-05", reporter_id: "u-003", reason: "other", note: "انقطاع في نهاية التسجيل.", status: "resolved", created_at: d(6) },
];

export const MOCK_CONTENT_REPORTS: ContentReport[] = [
  { id: "crep-1", hadith_id: "h-002", reporter_id: "u-002", error_type: "tashkeel", description: "كلمة «الحَيَاءُ» تحتاج ضبطاً؛ الظاهر أنها بالرفع لا بالنصب.", status: "open", created_at: d(3) },
  { id: "crep-2", hadith_id: "h-001", reporter_id: "u-004", error_type: "translation", description: "الترجمة الإندونيسية لكلمة «هجرة» غير دقيقة في السياق.", status: "open", created_at: d(2) },
  { id: "crep-3", hadith_id: "h-004", reporter_id: "u-003", error_type: "takhrij", description: "رقم الحديث في البخاري ينبغي أن يكون 71 لا 17.", status: "resolved", created_at: d(9) },
];
