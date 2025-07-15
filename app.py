import streamlit as st
import requests
import shutil
import uuid
from pathlib import Path
from ui_layout import render_ui, render_sidebar, render_product_list, render_product_tiles

BACKEND_URL = "http://127.0.0.1:8000"

# ─────── API Callers ─────────────────────────────
def call_text_search_api(query: str):
    try:
        res = requests.post(f"{BACKEND_URL}/search-text", json={"query": query})
        if res.status_code == 200:
            data = res.json()
            return data.get("items", []), data.get("meta", {})
        else:
            st.error(f"API Error {res.status_code}: {res.text}")
            return [], {}
    except Exception as e:
        st.error(f"API call failed: {e}")
        return [], {}

def call_image_search_api(file_path: str):
    try:
        with open(file_path, "rb") as f:
            files = {"file": (Path(file_path).name, f, "multipart/form-data")}
            res = requests.post(f"{BACKEND_URL}/search-image", files=files)
        if res.status_code == 200:
            data = res.json()
            return data.get("items", []), data.get("meta", {})
        else:
            st.error(f"API Error {res.status_code}: {res.text}")
            return [], {}
    except Exception as e:
        st.error(f"Image API call failed: {e}")
        return [], {}

def call_product_comparison_api(prod1, prod2):
    try:
        res = requests.post(f"{BACKEND_URL}/compare-products", json={
            "product1": prod1,
            "product2": prod2
        })
        if res.status_code == 200:
            return res.json()
        else:
            st.error(f"Comparison API Error {res.status_code}: {res.text}")
            return None
    except Exception as e:
        st.error(f"Comparison API call failed: {e}")
        return None

# ─────── Main UI ─────────────────────────────
def main():
    st.set_page_config(page_title="Market_One", layout="wide", page_icon="🛒")

    logo_path = "C:/Projects/ProductAggregator/lofin.jpg"
    render_ui(logo_path=logo_path)

    search_type, view_mode = render_sidebar()

    if search_type == "Text":
        st.markdown("<div class='fancy-header'><h2>📝 Text Search</h2></div>", unsafe_allow_html=True)
        user_query = st.text_input("Enter product keywords:")

        if st.button("Search Products", use_container_width=True):
            if not user_query.strip():
                st.warning("Please enter a valid query.")
            else:
                with st.spinner("🔍 Searching..."):
                    products, meta = call_text_search_api(user_query)

                with st.expander("🔬 Query Analysis"):
                    st.json(meta)

                if products:
                    st.success(f"✅ Found {len(products)} products.")
                    display_results(products, view_mode)
                else:
                    st.warning("No products found.")

    elif search_type == "Image":
        st.markdown("<div class='fancy-header'><h2>🖼️ Image Search</h2></div>", unsafe_allow_html=True)
        uploaded_file = st.file_uploader("Upload an image", type=["jpg", "jpeg", "png"])

        if uploaded_file:
            temp_path = Path("temp_uploads") / f"{uuid.uuid4().hex}{Path(uploaded_file.name).suffix}"
            temp_path.parent.mkdir(exist_ok=True)

            with open(temp_path, "wb") as f:
                shutil.copyfileobj(uploaded_file, f)

            st.image(str(temp_path), caption="Uploaded Image", width=300)

            if st.button("Search Similar Products", use_container_width=True):
                with st.spinner("🔍 Finding similar products..."):
                    products, meta = call_image_search_api(str(temp_path))

                with st.expander("🔬 Image Metadata"):
                    st.json(meta)

                if products:
                    st.success(f"✅ Found {len(products)} visually similar products.")
                    if view_mode == "List View":
                        render_product_list(products, show_similarity=True)
                    else:
                        render_product_tiles(products, show_similarity=True)
                else:
                    st.warning("No matching products found.")

                temp_path.unlink(missing_ok=True)

def display_results(products, view_mode):
    # Product Comparison Section
    st.subheader("📊 Compare Two Products")
    options = {f"{i+1}. {p['name'][:60]} (Rs. {p.get('price', '-')})": p for i, p in enumerate(products)}
    opt_keys = list(options.keys())

    if len(opt_keys) >= 2:
        p1_key = st.selectbox("Select Product 1", opt_keys, index=0)
        p2_key = st.selectbox("Select Product 2", opt_keys, index=1)

        if st.button("🔎 Compare These Products"):
            comparison = call_product_comparison_api(options[p1_key], options[p2_key])
            if comparison:
                st.success("✅ Comparison completed")
                st.markdown("**🧠 LLM Recommendation:**")
                st.markdown(f"""
                    <div style='background: #f4f4f4; padding: 1rem; border-left: 5px solid #800080;'>
                        {comparison['recommendation']}
                    </div>
                """, unsafe_allow_html=True)

                st.markdown(f"**🔬 Similarity Scores**\n\n- {p1_key}: {comparison['similarity_scores']['product_1']:.3f}\n- {p2_key}: {comparison['similarity_scores']['product_2']:.3f}")

    if view_mode == "List View":
        render_product_list(products)
    else:
        render_product_tiles(products)

if __name__ == "__main__":
    main()
