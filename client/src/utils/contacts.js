export const SHORT_TERM_CONTACT = {
  label: "Short Term & Holiday Lets",
  display: "+94 77 335 5464",
  tel: "+94773355464",
};

export const LONG_TERM_SALES_CONTACT = {
  label: "Long Term Rent & Sales",
  display: "+94 777 396596",
  tel: "+94777396596",
};

export const CONTACTS = [SHORT_TERM_CONTACT, LONG_TERM_SALES_CONTACT];

export function getContactForCategory(category) {
  return category === "short_term_rent"
    ? SHORT_TERM_CONTACT
    : LONG_TERM_SALES_CONTACT;
}
