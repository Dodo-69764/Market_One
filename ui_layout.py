import streamlit as st
from typing import List

# 🎨 Theme colors
SIDEBAR_GRADIENT = "linear-gradient(160deg, #6a0dad, #8f57ff)"
TITLE_GRADIENT = "linear-gradient(90deg, #6a0dad, #a974ff)"
BACKGROUND_COLOR = "#faf8fd"
TEXT_COLOR = "#2c2c2c"

def render_ui(logo_path: str = None):
    # Custom CSS styling
    st.markdown(f"""
        <style>
            html, body, [class*="css"] {{
                font-family: 'Segoe UI', sans-serif;
                background-color: {BACKGROUND_COLOR};
            }}
            .reportview-container {{
                color: {TEXT_COLOR};
            }}
            .stButton>button {{
                background-color: #6a0dad;
                color: white;
                border: none;
                padding: 0.5rem 1.2rem;
                font-weight: bold;
                border-radius: 10px;
            }}
            /* Purple sidebar */
            section[data-testid="stSidebar"] > div:first-child {{
                background: {SIDEBAR_GRADIENT};
                color: white;
                height: 100%;
            }}
            section[data-testid="stSidebar"] h1, section[data-testid="stSidebar"] h2,
            section[data-testid="stSidebar"] label, section[data-testid="stSidebar"] span {{
                color: white !important;
            }}
            /* Title header box */
            .gradient-panel {{
                background: {TITLE_GRADIENT};
                padding: 1.5rem;
                border-radius: 18px;
                text-align: center;
                margin-bottom: 1.5rem;
                box-shadow: 0 4px 14px rgba(106, 13, 173, 0.25);
            }}
            .gradient-panel h1 {{
                font-size: 2.8rem;
                font-weight: 800;
                color: white;
                margin-bottom: 0.3rem;
            }}
            .gradient-panel p {{
                font-size: 1.2rem;
                color: #f5eaff;
                margin-top: -0.3rem;
            }}
        </style>
    """, unsafe_allow_html=True)

    # Render gradient panel header (center of screen)
    st.markdown("""
        <div class="gradient-panel">
            <h1>Market_One</h1>
            <p>All Markets, One Vista.</p>
        </div>
    """, unsafe_allow_html=True)

    # Sidebar logo + heading
    if logo_path:
        st.sidebar.image(logo_path, use_container_width=True)
    st.sidebar.markdown("##")
    st.sidebar.markdown("### Market_One 🛒")
    st.sidebar.markdown("*Explore anything. Anywhere.*")

def render_sidebar():
    st.sidebar.markdown("---")
    search_type = st.sidebar.radio("🔍 Choose search type:", ["Text", "Image"])
    view_mode = st.sidebar.selectbox("🖼️ Display mode:", ["Tile View", "List View"])
    return search_type, view_mode

def render_product_list(products: List[dict], show_similarity: bool = False):
    for product in products:
        st.markdown("---")
        title = product.get("title", "No title")
        price = product.get("price", "N/A")
        url = product.get("url", "#")
        source = product.get("source", "Unknown")
        similarity = product.get("similarity")

        st.subheader(title)
        st.markdown(f"💸 **Rs. {price}**")
        if similarity and show_similarity:
            st.markdown(f"🧠 Similarity: `{similarity:.2f}`")
        st.markdown(f"🛒 [{source}]({url})")

        image_url = product.get("image")
        if image_url:
            st.image(image_url, use_container_width=True)

def render_product_tiles(products: List[dict], show_similarity: bool = False):
    cols = st.columns(3)
    for idx, product in enumerate(products):
        with cols[idx % 3]:
            st.markdown("-----")
            image_url = product.get("image")
            if image_url:
                st.image(image_url, use_container_width=True)

            title = product.get("title", "No title")
            price = product.get("price", "N/A")
            source = product.get("source", "Unknown")
            url = product.get("url", "#")
            similarity = product.get("similarity")

            st.markdown(f"**{title}**")
            st.markdown(f"💸 Rs. {price}")
            if similarity and show_similarity:
                st.markdown(f"🧠 Similarity: `{similarity:.2f}`")
            st.markdown(f"🛒 [{source}]({url})")
